import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "users.json");

export async function readUsersFromJson() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Błąd odczytu pliku JSON:", error);
    return [];
  }
}

export async function writeUsersToJson(usersArray) {
  try {
    await fs.writeFile(filePath, JSON.stringify(usersArray, null, 2), "utf-8");
  } catch (error) {
    console.error("Błąd zapisu do pliku JSON:", error);
  }
}
