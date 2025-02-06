import fs from "fs";
import path from "path";

const sessionsFilePath = path.join(process.cwd(), "data", "sessions.json");

export function readSessionsFromJson() {
  try {
    const data = fs.readFileSync(sessionsFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export function writeSessionsToJson(sessions) {
  fs.writeFileSync(sessionsFilePath, JSON.stringify(sessions, null, 2));
}
