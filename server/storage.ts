import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  users,
  doctorProfiles,
  availabilitySlots,
  appointments,
  creditTransactions,
  medicalRecords,
  notifications,
  payouts,
  type User,
  type InsertUser,
  type DoctorProfile,
  type InsertDoctorProfile,
  type AvailabilitySlot,
  type InsertAvailabilitySlot,
  type Appointment,
  type InsertAppointment,
  type MedicalRecord,
  type InsertMedicalRecord,
  type Notification,
  type Payout,
  type CreditTransaction,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  getDoctorProfile(id: string): Promise<DoctorProfile | undefined>;
  getDoctorProfileByUserId(userId: string): Promise<DoctorProfile | undefined>;
  createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile>;
  updateDoctorProfile(id: string, updates: Partial<DoctorProfile>): Promise<DoctorProfile | undefined>;
  getAllDoctors(verifiedOnly?: boolean): Promise<(DoctorProfile & { user: User })[]>;

  getAvailabilitySlots(doctorId: string): Promise<AvailabilitySlot[]>;
  createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot>;
  updateAvailabilitySlot(id: string, updates: Partial<AvailabilitySlot>): Promise<AvailabilitySlot | undefined>;
  deleteAvailabilitySlot(id: string): Promise<void>;

  createAppointment(appointment: InsertAppointment & { id?: string }): Promise<Appointment>;
  getAppointmentsByPatient(patientId: string): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;

  addCredits(userId: string, amount: number, description: string, packageName?: string): Promise<void>;
  deductCredits(userId: string, amount: number, description: string): Promise<void>;
  getCreditTransactions(userId: string): Promise<CreditTransaction[]>;

  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]>;
  getMedicalRecordsByDoctor(doctorId: string): Promise<MedicalRecord[]>;

  createNotification(userId: string, title: string, message: string, type?: string): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  requestPayout(doctorId: string, amount: number): Promise<Payout>;
  getPayouts(doctorId: string): Promise<Payout[]>;
  getAllPayouts(): Promise<(Payout & { doctor: DoctorProfile & { user: User } })[]>;
  updatePayout(id: string, updates: Partial<Payout>): Promise<Payout | undefined>;

  getAdminStats(): Promise<{
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    pendingVerifications: number;
    completedAppointments: number;
    cancelledAppointments: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({ ...insertUser, id: randomUUID() }).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getDoctorProfile(id: string): Promise<DoctorProfile | undefined> {
    const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.id, id));
    return profile;
  }

  async getDoctorProfileByUserId(userId: string): Promise<DoctorProfile | undefined> {
    const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId));
    return profile;
  }

  async createDoctorProfile(profile: InsertDoctorProfile): Promise<DoctorProfile> {
    const [created] = await db.insert(doctorProfiles).values({ ...profile, id: randomUUID() }).returning();
    return created;
  }

  async updateDoctorProfile(id: string, updates: Partial<DoctorProfile>): Promise<DoctorProfile | undefined> {
    const [profile] = await db.update(doctorProfiles).set(updates).where(eq(doctorProfiles.id, id)).returning();
    return profile;
  }

  async getAllDoctors(verifiedOnly = false): Promise<(DoctorProfile & { user: User })[]> {
    const query = db
      .select()
      .from(doctorProfiles)
      .innerJoin(users, eq(doctorProfiles.userId, users.id));

    const results = verifiedOnly
      ? await query.where(eq(doctorProfiles.verificationStatus, "approved"))
      : await query;

    return results.map((r) => ({ ...r.doctor_profiles, user: r.users }));
  }

  async getAvailabilitySlots(doctorId: string): Promise<AvailabilitySlot[]> {
    return db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.doctorId, doctorId))
      .orderBy(availabilitySlots.date, availabilitySlots.startTime);
  }

  async createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const [created] = await db.insert(availabilitySlots).values({ ...slot, id: randomUUID() }).returning();
    return created;
  }

  async updateAvailabilitySlot(id: string, updates: Partial<AvailabilitySlot>): Promise<AvailabilitySlot | undefined> {
    const [slot] = await db.update(availabilitySlots).set(updates).where(eq(availabilitySlots.id, id)).returning();
    return slot;
  }

  async deleteAvailabilitySlot(id: string): Promise<void> {
    await db.delete(availabilitySlots).where(eq(availabilitySlots.id, id));
  }

  async createAppointment(appointment: InsertAppointment & { id?: string }): Promise<Appointment> {
    const [created] = await db
      .insert(appointments)
      .values({ ...appointment, id: appointment.id || randomUUID() })
      .returning();
    return created;
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.createdAt));
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.doctorId, doctorId))
      .orderBy(desc(appointments.createdAt));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appt] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appt;
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const [appt] = await db.update(appointments).set(updates).where(eq(appointments.id, id)).returning();
    return appt;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return db.select().from(appointments).orderBy(desc(appointments.createdAt));
  }

  async addCredits(userId: string, amount: number, description: string, packageName?: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ creditBalance: sql`${users.creditBalance} + ${amount}` })
        .where(eq(users.id, userId));
      await tx
        .insert(creditTransactions)
        .values({ id: randomUUID(), userId, type: "purchase", amount, description, packageName });
    });
  }

  async deductCredits(userId: string, amount: number, description: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ creditBalance: sql`${users.creditBalance} - ${amount}` })
        .where(eq(users.id, userId));
      await tx
        .insert(creditTransactions)
        .values({ id: randomUUID(), userId, type: "deduction", amount: -amount, description });
    });
  }

  async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    return db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [created] = await db.insert(medicalRecords).values({ ...record, id: randomUUID() }).returning();
    return created;
  }

  async getMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    return db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.createdAt));
  }

  async getMedicalRecordsByDoctor(doctorId: string): Promise<MedicalRecord[]> {
    return db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.doctorId, doctorId))
      .orderBy(desc(medicalRecords.createdAt));
  }

  async createNotification(userId: string, title: string, message: string, type = "info"): Promise<Notification> {
    const [notif] = await db
      .insert(notifications)
      .values({ id: randomUUID(), userId, title, message, type })
      .returning();
    return notif;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async requestPayout(doctorId: string, amount: number): Promise<Payout> {
    const [payout] = await db
      .insert(payouts)
      .values({ id: randomUUID(), doctorId, amount, status: "pending" })
      .returning();
    await db
      .update(doctorProfiles)
      .set({ pendingPayouts: sql`${doctorProfiles.pendingPayouts} - ${amount}` })
      .where(eq(doctorProfiles.id, doctorId));
    return payout;
  }

  async getPayouts(doctorId: string): Promise<Payout[]> {
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.doctorId, doctorId))
      .orderBy(desc(payouts.requestedAt));
  }

  async getAllPayouts(): Promise<(Payout & { doctor: DoctorProfile & { user: User } })[]> {
    const results = await db
      .select()
      .from(payouts)
      .innerJoin(doctorProfiles, eq(payouts.doctorId, doctorProfiles.id))
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .orderBy(desc(payouts.requestedAt));
    return results.map((r) => ({
      ...r.payouts,
      doctor: { ...r.doctor_profiles, user: r.users },
    }));
  }

  async updatePayout(id: string, updates: Partial<Payout>): Promise<Payout | undefined> {
    const [payout] = await db.update(payouts).set(updates).where(eq(payouts.id, id)).returning();
    return payout;
  }

  async getAdminStats() {
    const [patientCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "patient"));
    const [doctorCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "doctor"));
    const [totalAppts] = await db.select({ count: sql<number>`count(*)` }).from(appointments);
    const [pendingVerifs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.verificationStatus, "pending"));
    const [completedAppts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.status, "completed"));
    const [cancelledAppts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.status, "cancelled"));

    return {
      totalPatients: Number(patientCount.count),
      totalDoctors: Number(doctorCount.count),
      totalAppointments: Number(totalAppts.count),
      pendingVerifications: Number(pendingVerifs.count),
      completedAppointments: Number(completedAppts.count),
      cancelledAppointments: Number(cancelledAppts.count),
    };
  }
}

export const storage = new DatabaseStorage();
