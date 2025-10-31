import express from "express";
import cors from "cors";
import authRouter from "./routes/authRouter";
import activityRouter from "./routes/activityRouter";
import calendarRouter from "./routes/calendarRouter";
import notesRouter from "./routes/notesRouter";
import habitsRouter from "./routes/habitsRouter";
import tasksRouter from "./routes/tasksRouter";
import "dotenv/config";

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(authRouter);
app.use(activityRouter);
app.use(calendarRouter);
app.use(notesRouter);
app.use(habitsRouter);
app.use(tasksRouter);

app.listen(3333, () => {
  console.log("Server running on http://localhost:3333");
});
