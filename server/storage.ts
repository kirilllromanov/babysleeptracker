import {
  type User, type InsertUser, users,
  type Child, type InsertChild, children,
  type SleepRecord, type InsertSleepRecord, type UpdateSleepRecord, sleepRecords,
  type SleepPrediction, type InsertSleepPrediction, sleepPredictions
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Child operations
  getChild(id: number): Promise<Child | undefined>;
  getAllChildren(): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined>;
  deleteChild(id: number): Promise<boolean>;

  // Sleep record operations
  getSleepRecord(id: number): Promise<SleepRecord | undefined>;
  getSleepRecordsByChildId(childId: number): Promise<SleepRecord[]>;
  getActiveSleepRecordByChildId(childId: number): Promise<SleepRecord | undefined>;
  createSleepRecord(sleepRecord: InsertSleepRecord): Promise<SleepRecord>;
  updateSleepRecord(id: number, sleepRecord: UpdateSleepRecord): Promise<SleepRecord | undefined>;

  // Sleep prediction operations
  getSleepPrediction(id: number): Promise<SleepPrediction | undefined>;
  getLatestSleepPredictionByChildId(childId: number): Promise<SleepPrediction | undefined>;
  createSleepPrediction(sleepPrediction: InsertSleepPrediction): Promise<SleepPrediction>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private children: Map<number, Child>;
  private sleepRecords: Map<number, SleepRecord>;
  private sleepPredictions: Map<number, SleepPrediction>;
  private userId: number;
  private childId: number;
  private sleepRecordId: number;
  private sleepPredictionId: number;

  constructor() {
    this.users = new Map();
    this.children = new Map();
    this.sleepRecords = new Map();
    this.sleepPredictions = new Map();
    this.userId = 1;
    this.childId = 1;
    this.sleepRecordId = 1;
    this.sleepPredictionId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Child operations
  async getChild(id: number): Promise<Child | undefined> {
    return this.children.get(id);
  }

  async getAllChildren(): Promise<Child[]> {
    return Array.from(this.children.values());
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    const id = this.childId++;
    const child: Child = { ...insertChild, id };
    this.children.set(id, child);
    return child;
  }

  async updateChild(id: number, childData: Partial<InsertChild>): Promise<Child | undefined> {
    const existingChild = this.children.get(id);
    
    if (!existingChild) {
      return undefined;
    }
    
    const updatedChild: Child = { ...existingChild, ...childData };
    this.children.set(id, updatedChild);
    return updatedChild;
  }

  async deleteChild(id: number): Promise<boolean> {
    return this.children.delete(id);
  }

  // Sleep record operations
  async getSleepRecord(id: number): Promise<SleepRecord | undefined> {
    return this.sleepRecords.get(id);
  }

  async getSleepRecordsByChildId(childId: number): Promise<SleepRecord[]> {
    return Array.from(this.sleepRecords.values())
      .filter(record => record.childId === childId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getActiveSleepRecordByChildId(childId: number): Promise<SleepRecord | undefined> {
    return Array.from(this.sleepRecords.values())
      .find(record => record.childId === childId && record.isActive === true);
  }

  async createSleepRecord(insertSleepRecord: InsertSleepRecord): Promise<SleepRecord> {
    const id = this.sleepRecordId++;
    const sleepRecord: SleepRecord = { ...insertSleepRecord, id };
    this.sleepRecords.set(id, sleepRecord);
    return sleepRecord;
  }

  async updateSleepRecord(id: number, updateData: UpdateSleepRecord): Promise<SleepRecord | undefined> {
    const existingRecord = this.sleepRecords.get(id);
    
    if (!existingRecord) {
      return undefined;
    }
    
    const updatedRecord: SleepRecord = { ...existingRecord, ...updateData };
    this.sleepRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Sleep prediction operations
  async getSleepPrediction(id: number): Promise<SleepPrediction | undefined> {
    return this.sleepPredictions.get(id);
  }

  async getLatestSleepPredictionByChildId(childId: number): Promise<SleepPrediction | undefined> {
    const predictions = Array.from(this.sleepPredictions.values())
      .filter(prediction => prediction.childId === childId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return predictions.length > 0 ? predictions[0] : undefined;
  }

  async createSleepPrediction(insertSleepPrediction: InsertSleepPrediction): Promise<SleepPrediction> {
    const id = this.sleepPredictionId++;
    const sleepPrediction: SleepPrediction = { 
      ...insertSleepPrediction, 
      id, 
      createdAt: new Date() 
    };
    this.sleepPredictions.set(id, sleepPrediction);
    return sleepPrediction;
  }
}

export const storage = new MemStorage();
