import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChildSchema, insertSleepRecordSchema, updateSleepRecordSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { predictNextSleep } from "./lib/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler for validation errors
  const handleValidationError = (err: unknown) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return { message: validationError.message };
    }
    return { message: String(err) };
  };

  // Child routes
  app.get("/api/children", async (_req, res) => {
    try {
      const children = await storage.getAllChildren();
      res.json(children);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.get("/api/children/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const child = await storage.getChild(id);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      res.json(child);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch child" });
    }
  });

  app.post("/api/children", async (req, res) => {
    try {
      const childData = insertChildSchema.parse(req.body);
      const child = await storage.createChild(childData);
      res.status(201).json(child);
    } catch (err) {
      res.status(400).json(handleValidationError(err));
    }
  });

  app.put("/api/children/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const childData = insertChildSchema.partial().parse(req.body);
      const updatedChild = await storage.updateChild(id, childData);
      if (!updatedChild) {
        return res.status(404).json({ message: "Child not found" });
      }
      res.json(updatedChild);
    } catch (err) {
      res.status(400).json(handleValidationError(err));
    }
  });

  app.delete("/api/children/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteChild(id);
      if (!deleted) {
        return res.status(404).json({ message: "Child not found" });
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete child" });
    }
  });

  // Sleep record routes
  app.get("/api/children/:childId/sleep-records", async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      const sleepRecords = await storage.getSleepRecordsByChildId(childId);
      res.json(sleepRecords);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch sleep records" });
    }
  });

  app.get("/api/children/:childId/active-sleep", async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      const activeSleepRecord = await storage.getActiveSleepRecordByChildId(childId);
      if (!activeSleepRecord) {
        return res.status(404).json({ message: "No active sleep record found" });
      }
      res.json(activeSleepRecord);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch active sleep record" });
    }
  });

  app.post("/api/sleep-records", async (req, res) => {
    try {
      const sleepRecordData = insertSleepRecordSchema.parse(req.body);
      const sleepRecord = await storage.createSleepRecord(sleepRecordData);
      res.status(201).json(sleepRecord);
    } catch (err) {
      res.status(400).json(handleValidationError(err));
    }
  });

  app.patch("/api/sleep-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = updateSleepRecordSchema.partial().parse(req.body);
      const updatedRecord = await storage.updateSleepRecord(id, updateData);
      if (!updatedRecord) {
        return res.status(404).json({ message: "Sleep record not found" });
      }
      res.json(updatedRecord);
    } catch (err) {
      res.status(400).json(handleValidationError(err));
    }
  });

  // Sleep prediction routes
  app.get("/api/children/:childId/sleep-prediction", async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      
      // First check if we have a recent prediction
      const existingPrediction = await storage.getLatestSleepPredictionByChildId(childId);
      
      // If prediction exists and is less than 30 minutes old, return it
      if (existingPrediction && 
          (new Date().getTime() - new Date(existingPrediction.createdAt).getTime() < 30 * 60 * 1000)) {
        return res.json(existingPrediction);
      }
      
      // Otherwise generate a new prediction
      const child = await storage.getChild(childId);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      
      // Calculate child's age in months
      const birthDate = new Date(child.birthDate);
      const ageInMonths = Math.floor(
        (new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      
      // Get sleep records
      const sleepRecords = await storage.getSleepRecordsByChildId(childId);
      
      // Format sleep records for the prediction service
      const formattedRecords = sleepRecords.map(record => ({
        startTime: new Date(record.startTime),
        endTime: record.endTime ? new Date(record.endTime) : null,
        quality: record.quality
      }));
      
      // Get prediction from OpenAI
      const prediction = await predictNextSleep(ageInMonths, formattedRecords);
      
      // Save the prediction
      const savedPrediction = await storage.createSleepPrediction({
        childId,
        predictedTime: new Date(prediction.nextSleepTime),
        predictedDuration: prediction.predictedDuration
      });
      
      res.json(savedPrediction);
    } catch (err) {
      console.error("Error generating sleep prediction:", err);
      res.status(500).json({ message: "Failed to generate sleep prediction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
