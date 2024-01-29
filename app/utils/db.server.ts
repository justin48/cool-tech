/**
 * Don't worry too much about this file. It's just an in-memory "database"
 * for the purposes of our workshop. The data modeling workshop will cover
 * the proper database.
 */
import crypto from "crypto";
import { factory, manyOf, nullable, oneOf, primaryKey } from "@mswjs/data";
import { singleton } from "./singleton.server.ts";

const getId = () => crypto.randomBytes(16).toString("hex").slice(0, 8);

export const db = singleton("db", () => {
  const db = factory({
    user: {
      id: primaryKey(getId),
      email: String,
      username: String,
      name: nullable(String),

      createdAt: () => new Date(),

      tech: manyOf("tech"),
    },
    tech: {
      id: primaryKey(getId),
      title: String,
      content: String,

      createdAt: () => new Date(),

      owner: oneOf("user"),
    },
  });

  const kody = db.user.create({
    id: "9d6eba59daa2fc2078cf8205cd451041",
    email: "kody@kcd.dev",
    username: "kody",
    name: "Kody",
  });

  const kodyTechnologies = [
    {
      id: "d27a197e",
      title: "Docker",
      content:
        "Docker is a set of platform as a service products that use OS-level virtualization to deliver software in packages called containers. The service has both free and premium tiers. The software that hosts the containers is called Docker Engine. It was first released in 2013 and is developed by Docker, Inc.",
    },
    {
      id: "414f0c09",
      title: "Java",
      content:
        "Java is a high-level, class-based, object-oriented programming language that is designed to have as few implementation dependencies as possible.",
    },
    {
      id: "260366b1",
      title: "Spring",
      content:
        "The Spring Framework is an application framework and inversion of control container for the Java platform. The framework's core features can be used by any Java application, but there are extensions for building web applications on top of the Java EE platform.",
    },
    {
      id: "bb79cf45",
      title: "Gradle",
      content:
        "Gradle is a build automation tool for multi-language software development. It controls the development process in the tasks of compilation and packaging to testing, deployment, and publishing. Supported languages include Java, C/C++, and JavaScript!",
    },
    {
      id: "9f4308be",
      title: "Maven",
      content:
        "Maven is a build automation tool used primarily for Java projects. Maven can also be used to build and manage projects written in C#, Ruby, Scala, and other languages. The Maven project is hosted by The Apache Software Foundation, where it was formerly part of the Jakarta Project!",
    },
    {
      id: "306021fb",
      title: "Databases",
      content:
        "In computing, a database is an organized collection of data or a type of data store based on the use of a database management system, the software that interacts with end users, applications, and the database itself to capture and analyze the data!",
    },
    {
      id: "16d4912a",
      title: "Postgres",
      content:
        "PostgreSQL, also known as Postgres, is a free and open-source relational database management system emphasizing extensibility and SQL compliance.",
    },
    {
      id: "3199199e",
      title: "SQL",
      content:
        "Structured Query Language is a domain-specific language used in programming and designed for managing data held in a relational database management system, or for stream processing in a relational data stream management system!",
    },
    {
      id: "2030ffd3",
      title: "Mongo",
      content:
        "MongoDB is a source-available, cross-platform, document-oriented database program. Classified as a NoSQL database product, MongoDB utilizes JSON-like documents with optional schemas. MongoDB is developed by MongoDB Inc. and current versions are licensed under the Server Side Public License!",
    },
    {
      id: "f375a804",
      title: "Angular",
      content:
        "Angular is a TypeScript-based, free and open-source single-page web application framework led by the Angular Team at Google and by a community of individuals and corporations. Angular is a complete rewrite from the same team that built AngularJS!",
    },
    {
      id: "562c541b",
      title: "React",
      content:
        "React is a free and open-source front-end JavaScript library for building user interfaces based on components. It is maintained by Meta and a community of individual developers and companies. React can be used to develop single-page, mobile, or server-rendered applications with frameworks like Next.js!",
    },
    // extra long note to test scrolling
    {
      id: "f67ca40b",
      title: "Remix",
      content:
        "A remix is a piece of media which has been altered or contorted from its original state by adding, removing, or changing pieces of the item. A song, piece of artwork, book, poem, or photograph can all be remixes!",
    },
  ];

  for (const note of kodyTechnologies) {
    db.tech.create({
      ...note,
      owner: kody,
    });
  }

  return db;
});
