import * as pg from "pg";

export interface IEventPayload {
  table_name: string;
  when: "BEFORE" | "AFTER" | "INSTEAD OF";
  operation: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, any> | null;
  old: Record<string, any> | null;
}
export interface IModel {
  table_name: string;
  model_name: string;
}
export class CreateSubscription {
  private pgClient: pg.Client;
  constructor(dbUrl: string = process.env.DATABASE_URL) {
    this.pgClient = new pg.Client(dbUrl);
    this.pgClient.connect();
  }

  private async createOrReplaceFunction() {
    await this.pgClient.query(`
    CREATE OR REPLACE FUNCTION notify_table_update()
      RETURNS TRIGGER 
      LANGUAGE PLPGSQL  
      AS
    $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify(
            'update_' || TG_TABLE_NAME,
            json_build_object('table_name', TG_TABLE_NAME, 'when', TG_WHEN, 'operation', TG_OP, 'new', row_to_json(NEW), 'old', row_to_json(OLD))::text 
        );
      END IF;

      IF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify(
            'update_' || TG_TABLE_NAME,
            json_build_object('table_name', TG_TABLE_NAME, 'when', TG_WHEN, 'operation', TG_OP, 'new', row_to_json(NEW), 'old', row_to_json(OLD))::text 
        );
      END IF;

      IF TG_OP = 'DELETE' THEN
        PERFORM pg_notify(
            'update_' || TG_TABLE_NAME,
            json_build_object('table_name', TG_TABLE_NAME, 'when', TG_WHEN, 'operation', TG_OP, 'new', row_to_json(NEW), 'old', row_to_json(OLD))::text
        );
      END IF;
      RETURN null;
    END;
    $$;
  `);
  }
  createListeners(models: IModel[] | string[]) {
    this.createOrReplaceFunction();
    models.forEach((model: string | IModel) => {
      let triggerName = null;
      let tableName = null;
      if (typeof model === "string") {
        triggerName = model.toLowerCase();
        tableName = model;
      } else {
        triggerName = model.model_name.toLowerCase();
        tableName = model.table_name;
      }
      this.pgClient.query(`
      DO
      $$
      BEGIN
      IF NOT EXISTS(SELECT *
        FROM information_schema.triggers
        WHERE event_object_table = '${tableName}'
        AND trigger_name = '${triggerName}_notify_trigger'
        )
      THEN
        CREATE TRIGGER "${triggerName}_notify_trigger"
          AFTER UPDATE OR INSERT OR DELETE ON "${tableName}"
          FOR EACH ROW
        EXECUTE PROCEDURE notify_table_update();
      END IF;
      END;
      $$
      `);
      this.pgClient.query(`LISTEN "update_${tableName}"`);
    });
  }

  recieveEvents(recivePayload: (paylaod: IEventPayload) => void) {
    this.pgClient.on("notification", async (message) => {
      const payload = JSON.parse(message.payload);

      recivePayload(payload);
    });
  }
}
