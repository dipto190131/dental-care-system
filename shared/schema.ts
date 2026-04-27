import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["patient", "doctor", "admin"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);
export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
]);
export const slotStatusEnum = pgEnum("slot_status", ["available", "booked"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "purchase",
  "deduction",
  "refund",
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: userRoleEnum("role").notNull().default("patient"),
  creditBalance: integer("credit_balance").notNull().default(0),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const doctorProfiles = pgTable("doctor_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  specialty: text("specialty").notNull(),
  bio: text("bio"),
  licenseNumber: text("license_number").notNull(),
  yearsExperience: integer("years_experience").notNull().default(0),
  consultationFee: integer("consultation_fee").notNull().default(2),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("total_reviews").notNull().default(0),
  verificationStatus: verificationStatusEnum("verification_status")
    .notNull()
    .default("pending"),
  verificationNotes: text("verification_notes"),
  clinicName: text("clinic_name"),
  clinicAddress: text("clinic_address"),
  education: text("education"),
  totalEarnings: integer("total_earnings").notNull().default(0),
  pendingPayouts: integer("pending_payouts").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const availabilitySlots = pgTable("availability_slots", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id")
    .notNull()
    .references(() => doctorProfiles.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: slotStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: varchar("doctor_id")
    .notNull()
    .references(() => doctorProfiles.id),
  slotId: varchar("slot_id")
    .notNull()
    .references(() => availabilitySlots.id),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  creditsCost: integer("credits_cost").notNull().default(2),
  isVideoCall: boolean("is_video_call").notNull().default(false),
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: transactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  packageName: text("package_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const medicalRecords = pgTable("medical_records", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: varchar("doctor_id")
    .notNull()
    .references(() => doctorProfiles.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  diagnosis: text("diagnosis").notNull(),
  treatment: text("treatment"),
  prescriptions: jsonb("prescriptions").$type<
    { medication: string; dosage: string; duration: string }[]
  >(),
  notes: text("notes"),
  followUpDate: text("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id")
    .notNull()
    .references(() => users.id),
  doctorId: varchar("doctor_id")
    .notNull()
    .references(() => doctorProfiles.id),
  appointmentId: varchar("appointment_id")
    .notNull()
    .references(() => appointments.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const doctorPrivateNotes = pgTable("doctor_private_notes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id")
    .notNull()
    .references(() => doctorProfiles.id),
  patientId: varchar("patient_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  doctorId: varchar("doctor_id")
    .notNull()
    .references(() => doctorProfiles.id),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  creditBalance: true,
});

export const insertDoctorProfileSchema = createInsertSchema(doctorProfiles).omit({
  id: true,
  createdAt: true,
  verificationStatus: true,
  rating: true,
  totalReviews: true,
  totalEarnings: true,
  pendingPayouts: true,
});

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type InsertDoctorProfile = z.infer<typeof insertDoctorProfileSchema>;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type MedicalRecord = typeof medicalRecords.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type Notification = typeof notifications.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
