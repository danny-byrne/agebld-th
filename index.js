const fs = require("fs");
// const parse = require("csv-parse");
const path = require("node:path");
// import { parse } from "csv-parse";
const csv = require("csv-parse");

const { parse, transform, stringify } = csv;

// Construct the file paths to read CSV files
const slcspFilePath = path.join(__dirname, "assets", "slcsp.csv");
const plansFilePath = path.join(__dirname, "assets", "plans.csv");
const zipsFilePath = path.join(__dirname, "assets", "zips.csv");

// Read CSV files
const slcspData = fs.readFileSync(slcspFilePath, "utf8");
const plansData = fs.readFileSync(plansFilePath, "utf8");
const zipsData = fs.readFileSync(zipsFilePath, "utf8");

console.log({ slcspData, plansData, zipsData });

// Parse CSV data
const parseOptions = { columns: true, skip_empty_lines: true };
const slcspRows = parse(slcspData, parseOptions);
const plansRows = parse(plansData, parseOptions);
const zipsRows = parse(zipsData, parseOptions);

console.log({ slcspRows, plansRows, zipsRows });

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

// Iterate through each ZIP code in slcsp.csv and calculate SLCSP rate
const slcspWithRates = slcspRows.map((row) => {
  const zip = row["zipcode"];
  const rateAreas = zipToRateArea[zip];
  if (!rateAreas || rateAreas.length !== 1) {
    return { ...row, rate: "" }; // Ambiguous or unknown rate area
  }
  const rateArea = rateAreas[0];
  const slcspRate = findSecondLowestSilverPlanRate(plansRows, rateArea);
  return { ...row, rate: slcspRate ? slcspRate.toFixed(2) : "" };
});

// Output the modified slcsp.csv data
const outputCsv = [
  Object.keys(slcspRows[0]).join(","), // Headers
  ...slcspWithRates.map((row) => Object.values(row).join(",")),
].join("\n");

console.log(outputCsv);
