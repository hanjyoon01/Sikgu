import { type User, type InsertUser, type Order, type InsertOrder, type Subscription, type InsertSubscription } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoins(userId: string, coins: number): Promise<User | undefined>;
  updateUserProfile(userId: string, data: { address?: string; phone?: string }): Promise<User | undefined>;
  updateUserPassword(userId: string, password: string): Promise<User | undefined>;
  
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionsByUserId(userId: string): Promise<Subscription[]>;
  cancelSubscription(subscriptionId: string): Promise<Subscription | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private subscriptions: Map<string, Subscription>;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.subscriptions = new Map();
    
    // Add default user
    const defaultUser: User = {
      id: "default-user-id",
      username: "tlrrn",
      password: "12345678a",
      coins: 10,
      address: null,
      phone: null,
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, coins: 0, address: null, phone: null };
    this.users.set(id, user);
    return user;
  }

  async updateUserCoins(userId: string, coins: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, coins };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(userId: string, data: { address?: string; phone?: string }): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(userId: string, password: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, password };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      status: insertOrder.status || "active",
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter((order) => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = {
      ...insertSubscription,
      id,
      status: insertSubscription.status || "active",
      autoRenew: insertSubscription.autoRenew ?? 1,
      expiresAt: insertSubscription.expiresAt || null,
      canceledAt: insertSubscription.canceledAt || null,
      createdAt: new Date(),
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return undefined;
    
    const updatedSubscription = {
      ...subscription,
      autoRenew: 0,
      canceledAt: new Date(),
    };
    this.subscriptions.set(subscriptionId, updatedSubscription);
    return updatedSubscription;
  }

  async getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values())
      .filter((sub) => sub.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
