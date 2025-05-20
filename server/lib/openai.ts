import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
// Do not change this unless explicitly requested by the user

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

interface SleepPattern {
  averageSleepDuration: number; // in minutes
  averageWakeTime: number; // minutes since last sleep
  sleepQualityScore: number; // 1-5
  timeOfDay: string[]; // "morning", "afternoon", "evening", "night"
}

interface SleepPrediction {
  nextSleepTime: string; // ISO string
  predictedDuration: number; // in minutes
  confidence: number; // 0-1
}

export async function predictNextSleep(
  childAge: number, // in months
  sleepRecords: {
    startTime: Date;
    endTime: Date | null;
    quality: string | null;
  }[]
): Promise<SleepPrediction> {
  try {
    // Filter out active sleep sessions
    const completedSleepRecords = sleepRecords.filter(
      (record) => record.endTime !== null
    );
    
    // Format data for OpenAI
    const formattedRecords = completedSleepRecords.map((record) => ({
      startTime: record.startTime.toISOString(),
      endTime: record.endTime?.toISOString(),
      quality: record.quality || "unknown",
      duration: record.endTime 
        ? Math.round((record.endTime.getTime() - record.startTime.getTime()) / (1000 * 60)) 
        : null
    }));

    // Add age-appropriate context about typical sleep patterns
    let ageContext = "";
    if (childAge < 3) {
      ageContext = "Newborns typically need 14-17 hours of sleep per day, with multiple naps.";
    } else if (childAge < 6) {
      ageContext = "Babies 3-6 months typically need 12-15 hours of sleep per day with 3-4 naps.";
    } else if (childAge < 12) {
      ageContext = "Babies 6-12 months typically need 11-14 hours of sleep per day with 2-3 naps.";
    } else if (childAge < 24) {
      ageContext = "Toddlers 1-2 years typically need 11-14 hours of sleep per day with 1-2 naps.";
    } else {
      ageContext = "Children 2+ years typically need 10-13 hours of sleep per day with 1 nap or no naps.";
    }

    const systemPrompt = `
      You are an expert pediatric sleep consultant. Your task is to analyze a child's sleep patterns 
      and predict when they should next go to sleep and for how long.
      
      Child's age: ${childAge} months
      ${ageContext}
      
      Here is the child's recent sleep history:
      ${JSON.stringify(formattedRecords, null, 2)}
      
      Current time: ${new Date().toISOString()}
      
      Analyze the sleep patterns, considering:
      1. Time between sleeps
      2. Duration of sleeps
      3. Quality of sleep
      4. Time of day patterns
      5. Age-appropriate sleep needs
      
      Provide a prediction in JSON format with these fields:
      - nextSleepTime: ISO timestamp for when the child should next go to sleep
      - predictedDuration: predicted sleep duration in minutes
      - confidence: your confidence in this prediction (0-1)
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }],
      response_format: { type: "json_object" },
    });

    const predictionData = JSON.parse(response.choices[0].message.content || "{}");
    
    // Default values in case of missing data
    const defaultPrediction: SleepPrediction = {
      nextSleepTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      predictedDuration: 90, // 90 minutes
      confidence: 0.5,
    };

    return {
      nextSleepTime: predictionData.nextSleepTime || defaultPrediction.nextSleepTime,
      predictedDuration: predictionData.predictedDuration || defaultPrediction.predictedDuration,
      confidence: predictionData.confidence || defaultPrediction.confidence,
    };
  } catch (error) {
    console.error("Error predicting next sleep:", error);
    
    // Fallback prediction
    return {
      nextSleepTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      predictedDuration: 90, // 90 minutes
      confidence: 0.5,
    };
  }
}
