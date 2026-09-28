import { createJob, getJob, markProcessing, markCompleted, markFailed, listJobsForUser } from "./jobsRepository.js";

async function run() {
  console.log("1. Creating a job...");
  const job = await createJob({
    userId: "user-123",
    filename: "chest_xray_001.jpg",
    originalKey: "raw/user-123/chest_xray_001.jpg",
  });
  console.log(job);

  console.log("\n2. Fetching it back...");
  console.log(await getJob(job.jobId));

  console.log("\n3. Marking as processing...");
  await markProcessing(job.jobId);
  console.log(await getJob(job.jobId));

  console.log("\n4. Testing idempotency guard (duplicate processing call should fail safely)...");
  try {
    await markProcessing(job.jobId);
    console.log("PROBLEM: this should NOT have succeeded");
  } catch (err) {
    console.log("Correctly rejected:", err.name);
  }

  console.log("\n5. Marking as completed...");
  await markCompleted(job.jobId, "enhanced/user-123/chest_xray_001_enhanced.jpg");
  console.log(await getJob(job.jobId));

  console.log("\n6. Listing all jobs for this user...");
  console.log(await listJobsForUser("user-123"));
}

run().catch((err) => console.error("Test failed:", err));