import * as pg from "pg";

const pgClient = new pg.Client(process.env.DATABASE_URL);

pgClient.connect();

export interface IEventPayload {
  table: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, any> | null;
  old: Record<string, any> | null;
}

export const createSubscribers = async (models: string[], fun: (paylaod: IEventPayload) => void) => {
  await pgClient.query(`
    CREATE OR REPLACE FUNCTION notify_table_update()
      RETURNS TRIGGER 
      LANGUAGE PLPGSQL  
      AS
    $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify(
            'update_' || TG_TABLE_NAME,
            json_build_object('table', TG_TABLE_NAME, 'type', TG_OP, 'new', row_to_json(NEW), 'old', row_to_json(OLD))::text 
        );
      END IF;

      IF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify(
            'update_' || TG_TABLE_NAME,
            json_build_object('table', TG_TABLE_NAME, 'type', TG_OP, 'new', row_to_json(NEW), 'old', row_to_json(OLD))::text 
        );
      END IF;

      IF TG_OP = 'DELETE' THEN
        PERFORM pg_notify(
            'update_' || TG_TABLE_NAME,
            json_build_object('table', TG_TABLE_NAME, 'type', TG_OP, 'new', row_to_json(NEW), 'old', row_to_json(OLD))::text
        );
      END IF;
      RETURN null;
    END;
    $$;
  `);
  models.forEach((model) => {
    pgClient.query(`
    DO
    $$
    BEGIN
    IF NOT EXISTS(SELECT *
      FROM information_schema.triggers
      WHERE event_object_table = '${model}'
      AND trigger_name = '${model.toLowerCase()}_notify_trigger'
      )
    THEN
      CREATE TRIGGER "${model.toLowerCase()}_notify_trigger"
        AFTER UPDATE OR INSERT OR DELETE ON "${model}"
        FOR EACH ROW
      EXECUTE PROCEDURE notify_table_update();
    END IF;
    END;
    $$
    `);
    pgClient.query(`LISTEN "update_${model}"`);
  });

  pgClient.on("notification", async (message) => {
    const payload = JSON.parse(message.payload);
    fun({
      table: payload.table,
      operation: payload.type,
      new: payload.new,
      old: payload.old,
    });
  });
};
