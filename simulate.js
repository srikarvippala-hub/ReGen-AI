require('dotenv').config();
const { handleArxivRss, handleTelegramCommand } = require('./services/openclaw');

async function run() {
    console.log("=== Booting OpenClaw Research Assistant (Simulation Mode) ===\n");
    
    // 1. First Live Task: ArXiv payload
    console.log(">> SIMULATING: ArXiv RSS Webhook payload for TETRA Project");
    const mockPayload = {
        title: "Real-time vehicle verification for smart parking",
        summary: "This paper proposes a low-latency architecture for real-time vehicle verification utilizing YOLOv8 and edge-computing devices. We provide the full framework code available on github and a custom dataset.",
        link: "https://arxiv.org/abs/1234.5678"
    };
    await handleArxivRss(mockPayload);
    
    console.log("\n>> SIMULATING: ArXiv RSS Webhook payload for Samsung Domain");
    const samsungPayload = {
        title: "On-Device Neural Network Optimization for Mobile Processors",
        summary: "This research demonstrates extreme quantization and pruning for neural networks directly deployed on Samsung mobile NPUs. The repository contains the fully buildable optimization scripts and C++ bindings.",
        link: "https://arxiv.org/abs/9876.5432"
    };
    await handleArxivRss(samsungPayload);
    console.log("\n------------------------------------------------\n");

    // 2. Audit Test: Telegram Command
    console.log(">> SIMULATING: Telegram /audit command on healthy repo");
    const auditResult = await handleTelegramCommand('/audit https://github.com/example/repo', { chat: { id: 123 } });
    console.log(auditResult);
    
    // 3. Auto-Archive Test: Telegram Command on bad repo
    console.log("\n>> SIMULATING: Telegram /audit command on broken repo");
    const archiveResult = await handleTelegramCommand('/audit https://github.com/example/broken-repo', { chat: { id: 123 } });
    console.log(archiveResult);

    console.log("\n=== Simulation Complete ===");
}

run();
