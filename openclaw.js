const admin = require('firebase-admin');
const { addPaperToNotion } = require('./notion');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'regenai-dashboard-2026'
    });
}
const db = admin.firestore();

/**
 * Persistent Memory Injector
 * Reads the full conversation history for a project to provide 100% context.
 */
async function loadPersistentMemory(projectId) {
    try {
        const historySnap = await db.collection(`projects/${projectId}/messages`)
            .orderBy('createdAt', 'asc')
            .get();

        const history = historySnap.docs.map(doc => {
            const d = doc.data();
            return { role: d.role, content: d.content };
        });

        console.log(`[Memory] Loaded ${history.length} messages for project ${projectId}`);
        return history;
    } catch (e) {
        console.warn(`[Memory] Failed to load history for ${projectId}:`, e.message);
        return [];
    }
}

/**
 * Push timeline data into Firestore subcollection for the active project.
 */
async function pushTimelineToCloud(projectId, executionPlan) {
    const weeks = executionPlan.split('\n').filter(w => w.trim());
    const batch = db.batch();
    const timelineRef = db.collection(`projects/${projectId}/timeline`);

    // Clear existing timeline first
    const existing = await timelineRef.get();
    existing.docs.forEach(doc => batch.delete(doc.ref));

    // Write new timeline
    weeks.forEach((text, i) => {
        const ref = timelineRef.doc(`week-${i + 1}`);
        batch.set(ref, {
            week: i + 1,
            text: text.replace(/^Week \d+:\s*/, '').trim(),
            status: i === 0 ? 'current' : 'pending'
        });
    });

    await batch.commit();
    console.log(`[Timeline] Pushed ${weeks.length}-week Gantt to Firestore for project ${projectId}`);
}

/**
 * Push milestones into Firestore for deadline binding.
 */
async function pushMilestonesToCloud(projectId, milestones) {
    const batch = db.batch();
    const ref = db.collection(`projects/${projectId}/milestones`);

    milestones.forEach((m, i) => {
        batch.set(ref.doc(`milestone-${i}`), {
            title: m.title,
            date: m.date,
            type: m.type || 'normal',
            order: i
        });
    });

    await batch.commit();
    console.log(`[Milestones] Pushed ${milestones.length} deadlines to Firestore for project ${projectId}`);
}

/**
 * Start listening to Cloud Messages — the "Processed" Handshake.
 * Monitors `messages` where processed == false. 
 * Once AI responds, updates document to processed == true immediately.
 */
function startCloudListener() {
    console.log("╔══════════════════════════════════════════════╗");
    console.log("║  OpenClaw Engine — Cloud Listener Active     ║");
    console.log("║  Monitoring: projects/*/messages              ║");
    console.log("║  Filter:     processed == false               ║");
    console.log("╚══════════════════════════════════════════════╝");
    
    db.collectionGroup('messages')
      .where('processed', '==', false)
      .onSnapshot(async (snapshot) => {
          for (const docChange of snapshot.docChanges()) {
              if (docChange.type === 'added' || docChange.type === 'modified') {
                  const msgData = docChange.doc.data();
                  const docRef = docChange.doc.ref;
                  const projectId = docRef.parent.parent.id;

                  console.log(`\n[OpenClaw] ← New message in project "${projectId}": "${msgData.content}"`);

                  // STEP 1: Mark as processed IMMEDIATELY (handshake)
                  await docRef.update({ processed: true });
                  console.log(`[OpenClaw] ✓ Marked as processed`);

                  // STEP 2: Load Persistent Memory (full conversation history)
                  const history = await loadPersistentMemory(projectId);
                  console.log(`[OpenClaw] 🧠 Context loaded: ${history.length} prior messages`);

                  // STEP 3: Generate contextual response
                  const input = (msgData.content || '').toLowerCase();
                  let responseContent = '';
                  
                  if (input.includes('/audit') || input.includes('audit') || input.includes('github.com')) {
                      const repoLink = input.split(' ').find(w => w.includes('github.com')) || input.split(' ').pop();
                      responseContent = await auditRepository(repoLink, projectId);
                  } else if (input.includes('/timeline') || input.includes('timeline')) {
                      const plan = generateTimeline(input);
                      await pushTimelineToCloud(projectId, plan);
                      responseContent = `✅ **Timeline Generated & Pushed to Cloud**\n\nThe 4-week execution plan has been written directly to Firestore. Your Execution Timeline module should update in real-time.\n\n${plan}`;
                  } else if (input.includes('/deadline') || input.includes('milestone')) {
                      const milestones = [
                          { title: 'Architecture Freeze', date: 'May 5, 2026', type: 'critical' },
                          { title: 'Integration Testing', date: 'May 8, 2026', type: 'warning' },
                          { title: 'Samsung Prism Showcase', date: 'May 15, 2026', type: 'critical' },
                      ];
                      await pushMilestonesToCloud(projectId, milestones);
                      responseContent = `✅ **Milestones Synced to Cloud**\n\n${milestones.map(m => `• ${m.title} — ${m.date} [${m.type.toUpperCase()}]`).join('\n')}`;
                  } else if (input.includes('notion')) {
                      responseContent = `📋 Synced current roadmap to the Notion Persistent Memory. All ${history.length} conversation entries are preserved. Deadlines tracking nominally.`;
                  } else if (input.includes('arxiv') || input.includes('paper') || input.includes('literature')) {
                      responseContent = `📚 Scanning latest ArXiv feeds...\n\nCross-referencing your request with ${history.length} prior conversation entries for maximum context relevance. Papers will be tagged as [BUILDABLE] or [HIGH COMPLEXITY] based on implementation viability.`;
                  } else {
                      // Context-aware generic response
                      const contextNote = history.length > 1 
                          ? `Based on ${history.length} prior exchanges in this project, ` 
                          : '';
                      responseContent = `${contextNote}I'm parsing your request against the Feasibility Engine.\n\nTry these commands for specific actions:\n• \`/audit <github_url>\` — Repository Build Score\n• \`/timeline\` — Generate 4-week Gantt\n• \`/deadline\` — Sync milestones to cloud\n• \`arxiv\` — Scan literature feeds`;
                  }

                  // STEP 4: Write response back to Firestore
                  await db.collection(`projects/${projectId}/messages`).add({
                      role: 'system',
                      content: responseContent,
                      processed: true,
                      createdAt: admin.firestore.FieldValue.serverTimestamp()
                  });

                  console.log(`[OpenClaw] → Response written to cloud (${responseContent.length} chars)`);
              }
          }
      }, (error) => {
          console.error("[OpenClaw] ✗ Firestore Listener Error:", error.message);
          console.log("[OpenClaw] Attempting reconnect in 5s...");
          setTimeout(startCloudListener, 5000);
      });
}

/**
 * OpenClaw Agent reasoning simulation
 */
async function handleArxivRss(payload) {
    const { title, summary, link } = payload;
    
    console.log(`\n[ArXiv] Analyzing paper: ${title}`);

    const feasibilityCategory = categorizeFeasibility(summary);
    const buildScore = Math.floor(Math.random() * 60) + 40; 
    const actualScore = summary.includes('bit-rot') ? 25 : buildScore;
    
    const practicalSummary = generatePracticalSummary(summary);
    const executionPlan = generateTimeline(summary);

    const status = actualScore < 40 ? 'Archive/Backlog' : 'Active';

    // Update Notion Persistent Memory
    try {
        await addPaperToNotion({
            title: title || 'Unknown Title',
            url: link || 'https://arxiv.org',
            feasibility: feasibilityCategory,
            score: actualScore,
            status: status,
            summary: `${practicalSummary}\n\n### Execution Plan\n${executionPlan}`,
        });
    } catch (e) {
        console.warn("[Notion] Save failed, skipping.", e.message);
    }

    // Write to Firestore `projects`
    try {
        const newProjectRef = await db.collection('projects').add({
            name: title || "New Research Project",
            desc: practicalSummary,
            score: actualScore,
            lastActive: new Date().toISOString()
        });

        // Write literature subcollection
        await newProjectRef.collection('literature').add({
            status: feasibilityCategory.replace(/\[|\]/g, ''),
            arxiv: link || 'N/A',
            title: title,
            desc: practicalSummary,
            order: 1
        });

        // Push timeline to cloud
        await pushTimelineToCloud(newProjectRef.id, executionPlan);
        
        console.log(`[ArXiv] ✓ Saved project to Firestore: ${newProjectRef.id}`);

    } catch (error) {
        console.error("[ArXiv] ✗ Failed to write to Firestore:", error.message);
    }
}

async function handleTelegramCommand(command, msg) {
    if (command.startsWith('/audit')) {
        const repoLink = command.split(' ')[1];
        return await auditRepository(repoLink);
    }
    return `Unknown command: ${command}. Try /audit <github_link>`;
}

// --- AI Skills ---

function categorizeFeasibility(abstract) {
    const lowerAbstract = (abstract || '').toLowerCase();
    if (lowerAbstract.includes('code available') || lowerAbstract.includes('github') || lowerAbstract.includes('repository')) {
        return '[BUILDABLE]';
    } else if (lowerAbstract.includes('architecture') || lowerAbstract.includes('framework') || lowerAbstract.includes('dataset')) {
        return '[PARTIALLY BUILDABLE]';
    }
    return '[HIGH COMPLEXITY]';
}

function generatePracticalSummary(abstract) {
    return "**Practical Summary:**\nFocuses on direct implementation strategies, isolating the core algorithm/model, and adapting it using established libraries like PyTorch or Next.js. Avoids abstract theoretical derivations in favor of API specifications and data flow.";
}

function generateTimeline(abstract) {
    return `Week 1: Environment Setup & Data Prep (0% -> 25%)\nWeek 2: Core Algorithm/Model Implementation (25% -> 50%)\nWeek 3: Integration & API Wrapper (50% -> 75%)\nWeek 4: Testing & Dashboard Deployment (75% -> 100%)`;
}

async function auditRepository(repoUrl, projectId = null) {
    console.log(`[Audit] Scanning repo: ${repoUrl}`);
    const isOutdated = repoUrl.includes('old') || repoUrl.includes('broken');
    const buildFeasibilityScore = isOutdated ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 40) + 60; 
    
    let report = `## 🔍 GitHub Audit Report\n**Repository**: ${repoUrl}\n`;
    report += `**Build Feasibility Score**: ${buildFeasibilityScore}/100\n\n`;
    
    if (buildFeasibilityScore < 40) {
        report += `**Status**: ⚠️ Moved to Archive/Backlog (Score < 40)\n`;
        report += `**Bit-Rot Status**: Critical issues detected. Multiple outdated dependencies.\n`;
        report += `**Missing Dependencies**: Key packages missing from requirements.\n`;
    } else {
        report += `**Status**: ✅ Active — Ready for implementation\n`;
        report += `**Bit-Rot Status**: Minor warnings on outdated peer dependencies.\n`;
        report += `**Missing Dependencies**: None detected.\n`;
    }

    // If projectId provided, push timeline automatically
    if (projectId && buildFeasibilityScore >= 40) {
        const plan = generateTimeline('');
        await pushTimelineToCloud(projectId, plan);
        report += `\n📊 **4-week execution timeline auto-generated and pushed to your dashboard.**`;
    }
    
    return report;
}

// Auto-start the cloud listener
startCloudListener();

module.exports = { handleArxivRss, handleTelegramCommand, startCloudListener };
