"use strict";

const { isEmpty, isNil } = require("lodash");
var btree = require("btreenode");

// Print all entries, across all of the sources, in chronological order.
module.exports = (logSources, printer) => {
  // Create a new tree
  let tree = null;

  function addLogEntry(logEntry, logSourceIndex) {
    if (!isNil(logEntry?.date)) {
      const entry = {
        timestamp: logEntry.date.getTime(),
        date: logEntry.date,
        message: logEntry.message,
        logSourceIndex: logSourceIndex,
      };

      if (tree === null) {
        // Init the btree with the first value
        tree = new btree.createTree();
        tree.init([entry], { key: "timestamp" });
      } else {
        // Add a log entry to btree
        tree.add(entry);
      }
    }
  }

  if (!isEmpty(logSources)) {
    // Populate tree with provided log sources recent messages
    logSources.forEach((logSource, logSourceIndex) => {
      const logEntry = logSource.pop();
      if (logEntry) {
        addLogEntry(logEntry, logSourceIndex);
      }
    });

    // Drain all log sources / Display all event log entries
    let recentEntry = null;

    do {
      // Find the most recent log entry
      recentEntry = tree.minimum();

      if (!isNil(recentEntry)) {
        const { timestamp, date, message, logSourceIndex } = recentEntry.value;

        // Display log entry
        printer.print({ date, message });

        // Add the next entry from the log entry origin log source
        const originLogSource = logSources[logSourceIndex];

        const logEntry = originLogSource.pop();

        if (logEntry) {
          addLogEntry(logEntry, logSourceIndex);
        }

        // Remove log entry from tree
        tree.remove(timestamp);

        recentEntry = tree.minimum();

        // There's a bug in the btree REMOVE method (this is a workaround)
        // https://github.com/richhaigh/btreenode/blob/master/lib/btree.js
        if (recentEntry.value.timestamp === timestamp) {
          break;
        }
      }
    } while (recentEntry !== null);
  }

  return console.log("Sync sort complete.");
};
