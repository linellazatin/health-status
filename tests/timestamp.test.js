const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync('public/scripts/timestamp.js', 'utf8');

function loadTimestampScript({ response = [], ok = true } = {}) {
    const timestamp = { textContent: '' };
    const testConsole = { error() {}, warn() {}, log() {} };
    const context = {
        console: testConsole,
        Date,
        Intl,
        Number,
        Object,
        document: { querySelector: () => timestamp },
        fetch: async () => ({ ok, status: ok ? 200 : 500, json: async () => response }),
        window: {}
    };

    vm.runInNewContext(source, context);
    return { timestamp, formatCommitDate: context.formatCommitDate };
}

test('formats a commit in the requested local-time shape', () => {
    const context = { console, Date, Intl, Number, Object, window: undefined };
    vm.runInNewContext(source, context);

    const formatted = context.formatCommitDate('2026-09-12T19:06:23Z');
    assert.match(formatted, /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} @ \d{2}:\d{2}:\d{2}$/);
});

test('uses the latest commit committer date', async () => {
    const { timestamp, formatCommitDate } = loadTimestampScript({
        response: [{
            commit: {
                author: { date: '2026-09-01T00:00:00Z' },
                committer: { date: '2026-09-12T19:06:23Z' }
            }
        }]
    });

    await new Promise(setImmediate);
    assert.equal(timestamp.textContent, `Last updated: ${formatCommitDate('2026-09-12T19:06:23Z')}`);
});

test('shows the fallback when GitHub is unavailable', async () => {
    const { timestamp } = loadTimestampScript({ ok: false });

    await new Promise(setImmediate);
    assert.equal(timestamp.textContent, 'Last updated: see GitHub');
});
