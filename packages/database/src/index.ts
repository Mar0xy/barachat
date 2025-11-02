import { MongoClient, Db, Collection } from 'mongodb';
import { createClient, RedisClientType } from 'redis';
import { config } from '@barachat/config';
import type { User, Server, Channel, Message, Member, Emoji } from '@barachat/models';

export class Database {
  private static instance: Database;
  private mongoClient: MongoClient;
  private redisClient: RedisClientType;
  private db!: Db;

  private constructor() {
    this.mongoClient = new MongoClient(config.database.mongodb);
    this.redisClient = createClient({ url: config.database.redis });
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
    
    console.log('Connected to MongoDB and Redis');
  }

  public async disconnect(): Promise<void> {
    await this.mongoClient.close();
    await this.redisClient.quit();
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
}

export const db = Database.getInstance();
