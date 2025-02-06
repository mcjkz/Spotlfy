import fs from "fs";
import path from "path";
import crypto from "crypto";

const USERS_FILE = path.join(process.cwd(), "data/users.json");

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

const JSONAdapter = {
  async createUser(user) {
    const users = readUsers();
    const newUser = {
      id: crypto.randomUUID(),
      email: user.email,
      salt: user.salt || "",
      verifier: user.verifier || "",
      name: user.name || "",
      dateOfBirth: user.dateOfBirth || "",
      gender: user.gender || "",
    };

    users.push(newUser);
    writeUsers(users);
    return newUser;
  },

  async getUser(id) {
    const users = readUsers();
    return users.find((u) => u.id === id) || null;
  },

  async getUserByEmail(email) {
    const users = readUsers();
    return users.find((u) => u.email === email) || null;
  },

  async updateUser(updatedUser) {
    const users = readUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updatedUser };
    writeUsers(users);
    return users[index];
  },

  async getUserByAccount({ providerAccountId, provider }) {
    const users = readUsers();
    for (const user of users) {
      if (
        user.accounts &&
        user.accounts.find(
          (account) =>
            account.provider === provider &&
            account.providerAccountId === providerAccountId
        )
      ) {
        return user;
      }
    }
    return null;
  },

  async linkAccount(account) {
    const users = readUsers();
    const user = users.find((u) => u.id === account.userId);
    if (!user) return null;
    if (!user.accounts) user.accounts = [];
    user.accounts.push(account);
    writeUsers(users);
    return account;
  },

  async createSession(session) {
    return session;
  },
  async getSession(sessionToken) {
    return null;
  },
  async updateSession(session) {
    return session;
  },
  async deleteSession(sessionToken) {
    return;
  },

  async getSessionAndUser(sessionToken) {
    return null;
  },
};

export default JSONAdapter;
