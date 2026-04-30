const { MongoClient } = require('mongodb');

async function main() {
    const client = new MongoClient("mongodb://localhost:27017/test");

    try {
        await client.connect();
        const db = client.db("test");
        const result = await db.collection("user").insertOne({ name: "bob" });
        console.log("Inserted:", result.insertedId);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.close();
        console.log("✓ Connection closed");
    }
}

main();