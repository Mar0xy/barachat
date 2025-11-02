import { MongoClient, Db, Collection } from 'mongodb';
import { createClient, RedisClientType } from 'redis';
import { config } from '@barachat/config';
import type { User, Server, Channel, Message, Member, Emoji, Invite } from '@barachat/models';
import type { 
  WebSocketEvent, 
  MessageEvent, 
  MessageDeleteEvent, 
  UserUpdateEvent,
  ChannelCreateEvent,
  ChannelUpdateEvent,
  ChannelDeleteEvent,
  ServerUpdateEvent,
  ServerDeleteEvent
} from '@barachat/models';

// Type for events that can be published via Redis
export type PublishableEvent = WebSocketEvent | MessageEvent | MessageDeleteEvent | UserUpdateEvent | 
  ChannelCreateEvent | ChannelUpdateEvent | ChannelDeleteEvent | ServerUpdateEvent | ServerDeleteEvent;

export class Database {
  private static instance: Database;
  private mongoClient: MongoClient;
  private redisClient: RedisClientType;
  private redisPublisher: RedisClientType;
  private db!: Db;

  private constructor() {
    this.mongoClient = new MongoClient(config.database.mongodb);
    this.redisClient = createClient({ url: config.database.redis });
    // Create a separate client for publishing (Redis best practice)
    this.redisPublisher = createClient({ url: config.database.redis });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    await this.mongoClient.connect();
    this.db = this.mongoClient.db();
    
    await this.redisClient.connect();
    await this.redisPublisher.connect();
    
    console.log('Connected to MongoDB and Redis');
  }

  public async disconnect(): Promise<void> {
    await this.mongoClient.close();
    await this.redisClient.quit();
    await this.redisPublisher.quit();
  }

  // Collections
  public get users(): Collection<User> {
    return this.db.collection<User>('users');
  }

  public get servers(): Collection<Server> {
    return this.db.collection<Server>('servers');
  }

  public get channels(): Collection<Channel> {
    return this.db.collection<Channel>('channels');
  }

  public get messages(): Collection<Message> {
    return this.db.collection<Message>('messages');
  }

  public get members(): Collection<Member> {
    return this.db.collection<Member>('members');
  }

  public get emojis(): Collection<Emoji> {
    return this.db.collection<Emoji>('emojis');
  }

  public get invites(): Collection<Invite> {
    return this.db.collection<Invite>('invites');
  }

  // Redis operations
  public getRedis(): RedisClientType {
    return this.redisClient;
  }

  public async setPresence(userId: string, online: boolean): Promise<void> {
    await this.redisClient.set(`presence:${userId}`, online ? '1' : '0', {
      EX: 300 // 5 minutes
    });
  }

  public async getPresence(userId: string): Promise<boolean> {
    const value = await this.redisClient.get(`presence:${userId}`);
    return value === '1';
  }

  public async setSession(userId: string, sessionId: string): Promise<void> {
    await this.redisClient.sAdd(`sessions:${userId}`, sessionId);
  }

  public async removeSession(userId: string, sessionId: string): Promise<void> {
    await this.redisClient.sRem(`sessions:${userId}`, sessionId);
  }

  public async getSessions(userId: string): Promise<string[]> {
    return await this.redisClient.sMembers(`sessions:${userId}`);
  }

  // Publish events for WebSocket server to broadcast
  public async publishEvent(event: PublishableEvent | { type: string; [key: string]: any }): Promise<void> {
    await this.redisPublisher.publish('websocket:events', JSON.stringify(event));
  }

  // Subscribe to events (used by WebSocket server)
  public async subscribeToEvents(callback: (event: PublishableEvent | { type: string; [key: string]: any }) => void): Promise<void> {
    // Create a duplicate connection for subscribing
    const subscriber = this.redisClient.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe('websocket:events', (message) => {
      try {
        const event = JSON.parse(message);
        callback(event);
      } catch (error) {
        console.error('Error parsing event:', error);
      }
    });
  }
}

export const db = Database.getInstance();
