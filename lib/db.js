import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "ecO#2006",
  database: "quizwhizzdatabase"
});

