# 📊 Starito Airtable Schema Summary

This document outlines the structure of all Airtable tables used in the Starito app.

---

## 🧍 Users

| Field Name   | Type              | Description |
|--------------|-------------------|-------------|
| Name         | Single line text  | Display name of the user |
| Role         | Single select     | "Child" or "Parent" |
| PIN          | Text              | 4-digit PIN for child login |
| Username     | Text              | Used for parent login |
| Password     | Text              | Used for parent login |
| Avatar URL   | Attachment        | Optional image for splash login |
| ID           | Autonumber        | Unique identifier |

---

## 🧹 Chores

| Field Name   | Type              | Description |
|--------------|-------------------|-------------|
| Title        | Single line text  | Name of the chore |
| Stars        | Number            | Points awarded for completion |
| Frequency    | Single select     | Daily, Weekly, or One-time |
| Required     | Checkbox          | Whether it’s a required task |
| Applies To   | Linked record     | Links to Users table Name column|
| Active       | Checkbox          | Whether chore is currently active |
| ID           | Autonumber        | Unique identifier |

---

## 📅 DailyTasks

| Field Name     | Type              | Description |
|----------------|-------------------|-------------|
| Date           | Date              | When the task is assigned |
| User           | Linked record     | Links to Users table Name column|
| Chore          | Linked record     | Links to Chores table Title column|
| Completed      | Checkbox          | Whether the child marked it done |
| Approved       | Checkbox          | Whether parent approved it |
| Stars Earned   | Number            | Final awarded points |
| ID             | Autonumber        | Unique identifier |

---

## 🎯 Challenges

| Field Name     | Type              | Description |
|----------------|-------------------|-------------|
| Description    | Long text         | Description of the challenge |
| Bonus Stars    | Number            | Additional points awarded |
| Active Today   | Checkbox          | Whether it is currently featured |
| Applies To     | Linked record     | Links to Users table Name column |
| Expiration     | Date              | Optional expiration date |
| ID             | Autonumber        | Unique identifier |

---

## 🎁 Rewards

| Field Name     | Type              | Description |
|----------------|-------------------|-------------|
| Name           | Single line text  | Name of the reward |
| Cost           | Number            | Point cost to redeem |
| Max Uses/Day   | Number            | Optional limit per day |
| Available      | Checkbox          | Whether reward is currently redeemable |
| ID             | Autonumber        | Unique identifier |

---

## 💰 Transactions

| Field Name     | Type              | Description |
|----------------|-------------------|-------------|
| Date           | Date              | Date of transaction |
| User           | Linked record     | Links to Users table Name column|
| Type           | Single select     | Earned, Redeemed, or Manual |
| Points         | Number            | Positive or negative points |
| Source         | Single line text  | Description or chore/reward name |
| ID             | Autonumber        | Unique identifier |