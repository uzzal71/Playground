import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1715000000000 implements MigrationInterface {
  name = 'InitialSchema1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM('customer', 'seller', 'rider', 'admin')
    `);
    await queryRunner.query(`
      CREATE TYPE "users_status_enum" AS ENUM('pending', 'active', 'suspended', 'locked', 'deleted')
    `);
    await queryRunner.query(`
      CREATE TYPE "verification_tokens_type_enum" AS ENUM('email_verification', 'password_reset')
    `);
    await queryRunner.query(`
      CREATE TYPE "audit_logs_event_type_enum" AS ENUM(
        'user.registered','user.login.success','user.login.failed','user.logout',
        'user.password.changed','user.password.reset.requested','user.password.reset.completed',
        'user.email.verification.sent','user.email.verified',
        'user.account.locked','user.account.unlocked',
        'user.2fa.enabled','user.2fa.disabled','user.2fa.verified','user.2fa.failed',
        'token.refreshed','token.revoked','token.reuse.detected','session.revoked'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "phone" varchar(20),
        "password_hash" varchar(255) NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'customer',
        "status" "users_status_enum" NOT NULL DEFAULT 'pending',
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_verified_at" timestamptz,
        "two_factor_enabled" boolean NOT NULL DEFAULT false,
        "two_factor_secret" varchar(255),
        "two_factor_backup_codes" text,
        "failed_login_attempts" int NOT NULL DEFAULT 0,
        "locked_until" timestamptz,
        "last_login_at" timestamptz,
        "last_login_ip" varchar(45),
        "password_changed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_phone" ON "users" ("phone")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "verification_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "type" "verification_tokens_type_enum" NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz,
        "request_ip" varchar(45),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_verification_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_verification_tokens_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_verification_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_verification_tokens_user_type" ON "verification_tokens" ("user_id", "type")`);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "ip_address" varchar(45),
        "user_agent" varchar(500),
        "device_id" varchar(100),
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "last_active_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_user" ON "sessions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_expires" ON "sessions" ("expires_at")`);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(255) NOT NULL,
        "family_id" uuid NOT NULL,
        "session_id" uuid,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "revoked_reason" varchar(50),
        "replaced_by_token_id" uuid,
        "created_ip" varchar(45),
        "user_agent" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user" ON "refresh_tokens" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_family" ON "refresh_tokens" ("family_id")`);

    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "event_type" "audit_logs_event_type_enum" NOT NULL,
        "ip_address" varchar(45),
        "user_agent" varchar(500),
        "metadata" jsonb,
        "success" boolean NOT NULL DEFAULT true,
        "failure_reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user" ON "audit_logs" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_event" ON "audit_logs" ("event_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_created" ON "audit_logs" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "audit_logs_event_type_enum"`);
    await queryRunner.query(`DROP TYPE "verification_tokens_type_enum"`);
    await queryRunner.query(`DROP TYPE "users_status_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
