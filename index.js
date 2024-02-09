const fs = require("fs");
const csv = require("csv-parse");
const path = require("node:path");

const { parse, transform, stringify } = csv;

// Construct the file paths to read CSV files
const slcspFilePath = path.join(__dirname, "assets", "slcsp.csv");
const plansFilePath = path.join(__dirname, "assets", "plans.csv");
const zipsFilePath = path.join(__dirname, "assets", "zips.csv");

// Read CSV files
const slcsp = fs.readFileSync(slcspFilePath, "utf8");
const plans = fs.readFileSync(plansFilePath, "utf8");
const zips = fs.readFileSync(zipsFilePath, "utf8");

// console.log({ slcsp, plans, zips });
// console.log({ plans });

// Parse CSV
const parseOptions = { columns: true, skip_empty_lines: true };
const slcspRows = parse(slcsp, parseOptions);
const plansRows = parse(plans, parseOptions);
const zipsRows = parse(zips, parseOptions);

// console.log({ slcspRows, plansRows, zipsRows });

// Create a map of ZIP codes to rate areas
const zipToRateArea = {};
zipsRows.forEach((row) => {
  const zip = row["zipcode"];
  const rateArea = row["rate_area"];
  if (!zipToRateArea[zip]) {
    zipToRateArea[zip] = [];
  }
  zipToRateArea[zip].push(rateArea);
});

// Function to find the second lowest silver plan rate for a given rate area
function findSecondLowestSilverPlanRate(plans, rateArea) {
  const silverPlansInArea = plans.filter((plan) => {
    return plan["metal_level"] === "Silver" && plan["rate_area"] === rateArea;
  });
  if (silverPlansInArea.length < 2) {
    return; // Not enough silver plans to determine SLCSP
  }
  const sortedRates = silverPlansInArea
    .map((plan) => parseFloat(plan["rate"]))
    .sort((a, b) => a - b);
  return sortedRates[1];
}

// Iterate through each ZIP code in slcsp.csv
slcspRows.forEach((row) => {
  const zip = row["zipcode"];
  const rateAreas = zipToRateArea[zip];
  if (!rateAreas || rateAreas.length !== 1) {
    console.log(`${zip},`); // Ambiguous or unknown rate area
    return;
  }
  const rateArea = rateAreas[0];
  const slcspRate = findSecondLowestSilverPlanRate(plansRows, rateArea);
  if (slcspRate) {
    console.log(`${zip},${slcspRate.toFixed(2)}`);
  } else {
    console.log(`${zip},`); // No second lowest cost silver plan
  }
});
