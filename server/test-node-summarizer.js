const nodeSummarizer = require('node-summarizer');
console.log('Exported keys:', Object.keys(nodeSummarizer));

try {
    const Summarizer = nodeSummarizer.Summarizer;
    const s = new Summarizer("This is a test. This is only a test. We need three sentences. Here is the third.", 2);
    console.log('Successfully created instance with .Summarizer');
} catch (e) {
    console.log('Failed with .Summarizer:', e.message);
}

try {
    const s = new nodeSummarizer("This is a test. This is only a test. We need three sentences. Here is the third.", 2);
    console.log('Successfully created instance directly');
} catch (e) {
    console.log('Failed directly:', e.message);
}
