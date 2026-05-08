/**
 * ReGenAI — Firestore Data Seeder
 * Run this ONCE after the Firestore database is created.
 * Usage: node services/seed-firestore.js
 */
const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'regenai-dashboard-2026'
    });
}
const db = admin.firestore();

async function seed() {
    console.log("╔═══════════════════════════════════════════╗");
    console.log("║  ReGenAI Firestore Seeder                 ║");
    console.log("║  Target: regenai-dashboard-2026            ║");
    console.log("╚═══════════════════════════════════════════╝\n");

    // 1. Create Project TETRA
    console.log("[1/5] Creating Project TETRA...");
    const tetraRef = db.collection('projects').doc('tetra');
    await tetraRef.set({
        name: 'Project TETRA',
        desc: 'Hardware-Integrated UI Architecture for Samsung Prism 2026',
        score: 92,
        lastActive: new Date().toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("  ✓ Project TETRA created");

    // 2. Seed Milestones (Deadlines)
    console.log("[2/5] Seeding milestones...");
    const milestones = [
        { title: 'Local Backend Porting', date: 'May 5, 2026', type: 'critical', order: 0 },
        { title: 'SQLite Schema Freeze', date: 'May 8, 2026', type: 'warning', order: 1 },
        { title: 'Showcase Demo Dry-Run', date: 'May 12, 2026', type: 'normal', order: 2 },
        { title: 'Samsung Prism Showcase', date: 'May 15, 2026', type: 'critical', order: 3 },
    ];
    for (const m of milestones) {
        await tetraRef.collection('milestones').doc(`milestone-${m.order}`).set(m);
    }
    console.log(`  ✓ ${milestones.length} milestones seeded`);

    // 3. Seed Literature
    console.log("[3/5] Seeding literature feed...");
    const literature = [
        {
            status: 'BUILDABLE',
            arxiv: '2605.01123',
            title: 'Efficient State Sync over BLE',
            desc: 'Direct implementation strategy for maintaining persistent state between React Native frontend and IoT peripherals using chunked BLE payloads.',
            order: 1
        },
        {
            status: 'HIGH COMPLEXITY',
            arxiv: '2605.00891',
            title: 'Theoretical Quantum Routing',
            desc: 'Lacks implementation bounds for current silicon. Not viable for 4-week execution.',
            order: 2
        },
        {
            status: 'BUILDABLE',
            arxiv: '2605.02340',
            title: 'On-Device Neural Network Optimization for Mobile NPUs',
            desc: 'Fully buildable optimization scripts and C++ bindings for Samsung mobile processors. Repository includes pre-trained weights.',
            order: 3
        }
    ];
    for (const lit of literature) {
        await tetraRef.collection('literature').doc(`lit-${lit.order}`).set(lit);
    }
    console.log(`  ✓ ${literature.length} papers seeded`);

    // 4. Seed Timeline (4-week Gantt)
    console.log("[4/5] Seeding execution timeline...");
    const timeline = [
        { week: 1, text: 'SQLite Core Setup & Schema Design', status: 'done' },
        { week: 2, text: 'Flask API Wrapper & Endpoint Binding', status: 'done' },
        { week: 3, text: 'Buildozer APK Generation & Testing', status: 'current' },
        { week: 4, text: 'Prism Showcase Polish & Deployment', status: 'pending' },
    ];
    for (const step of timeline) {
        await tetraRef.collection('timeline').doc(`week-${step.week}`).set(step);
    }
    console.log(`  ✓ ${timeline.length}-week timeline seeded`);

    // 5. Seed initial system message
    console.log("[5/5] Seeding initial chat message...");
    await tetraRef.collection('messages').add({
        role: 'system',
        content: 'ReGenAI Feasibility Engine initialized for Project TETRA. Persistent Memory loaded. Cloud connection established. How can I assist with your implementation today?',
        processed: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("  ✓ Initial system message created");

    console.log("\n══════════════════════════════════════════════");
    console.log("  ✅ SEED COMPLETE — All data written to Firestore");
    console.log("  🟢 Dashboard should now show Cloud Synced");
    console.log("══════════════════════════════════════════════");
}

seed().catch(err => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
