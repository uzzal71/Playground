import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqp-connection-manager";
import { ChannelWrapper, AmqpConnectionManager } from "amqp-connection-manager";
import { v4 as uuidv4 } from "uuid";

export interface DomainEvent<T = any> {
  eventId: string;
  eventType: string;
  eventVersion: string;
  occurredAt: string;
  payload: T;
  metadata: {
    service: string;
    correlationId?: string;
    userId?: string;
  };
}

@Injectable()
export class EventsPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsPublisherService.name);
  private connection!: AmqpConnectionManager;
  private channel!: ChannelWrapper;
  private readonly exchangeName: string;

  constructor(private readonly configService: ConfigService) {
    this.exchangeName = this.configService.get<string>(
      "rabbitmq.exchange",

      "user.events",
    );
  }

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>("rabbitmq.url")!;
    this.connection = amqp.connect([url]);

    this.connection.on("connect", () => {
      this.logger.log("Connected to RabbitMQ");
    });
    this.connection.on("disconnect", (err) => {
      this.logger.warn("Disconnected from RabbitMQ", err?.err);
    });

    this.channel = this.connection.createChannel({
      json: true,
      setup: async (channel: any) => {
        await channel.assertExchange(this.exchangeName, "topic", {
          durable: true,
        });
      },
    });
    await this.channel.waitForConnect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  async publish<T>(
    routingKey: string,
    payload: T,
    metadata?: Partial<DomainEvent["metadata"]>,
  ): Promise<void> {
    const event: DomainEvent<T> = {
      eventId: uuidv4(),
      eventType: routingKey,
      eventVersion: "1.0",
      occurredAt: new Date().toISOString(),
      payload,
      metadata: {
        service: "auth-service",
        ...metadata,
      },
    };

    try {
      await this.channel.publish(this.exchangeName, routingKey, event);
      this.logger.debug(`Published event: ${routingKey} (${event.eventId})`);
    } catch (err) {
      this.logger.error(`Failed to publish event ${routingKey}`, err);
    }
  }
}
