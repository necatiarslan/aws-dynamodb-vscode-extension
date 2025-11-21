# DynamoDB Capacity Sub-Nodes Implementation

## Overview
This implementation adds read and write capacity values as sub-nodes under the Capacity node in the DynamoDB tree view, making it easier to view and manage individual capacity settings.

## Changes Made

### 1. DynamodbTreeItem.ts
- **Added Properties**: 
  - `ReadCapacity: number | undefined`
  - `WriteCapacity: number | undefined`
  
- **Added UI Handlers**:
  - `ReadCapacity` tree item type with arrow-down icon
  - `WriteCapacity` tree item type with arrow-up icon

### 2. DynamodbTreeDataProvider.ts
- **Modified `PopulateTableDetails` method**:
  - Changed Capacity node to be collapsible when in PROVISIONED mode
  - Added ReadCapacity sub-node showing current read capacity units
  - Added WriteCapacity sub-node showing current write capacity units
  - Stores actual capacity values in the tree item properties
  - For PAY_PER_REQUEST mode, Capacity node remains non-collapsible

### 3. TreeItemType enum
- Already had `ReadCapacity = 25` and `WriteCapacity = 26` defined

## Features

### Read Capacity Values
- The ReadCapacity sub-node displays the current read capacity units
- Stored in the `ReadCapacity` property of the tree item
- Icon: arrow-down (↓)
- Context value: "ReadCapacity"

### Write Capacity Values
- The WriteCapacity sub-node displays the current write capacity units
- Stored in the `WriteCapacity` property of the tree item
- Icon: arrow-up (↑)
- Context value: "WriteCapacity"

## Tree Structure

```
📊 Table Name
  ├── 🔑 Primary Keys
  │   ├── Partition Key: pk (S)
  │   └── Sort Key: sk (S)
  ├── 📊 Capacity: Provisioned
  │   ├── ↓ Read Capacity: 10
  │   └── ↑ Write Capacity: 10
  ├── ℹ️ Table Info
  └── 🌳 Indexes
```

## Usage

1. **Viewing Capacity**: Expand the Capacity node to see individual read and write capacity values
2. **Reading Values**: Access via `node.ReadCapacity` or `node.WriteCapacity` properties
3. **Writing Values**: Update the properties and refresh the tree view to reflect changes

## Future Enhancements

Potential additions:
- Edit individual capacity values (read or write) directly from sub-nodes
- Add context menu commands for ReadCapacity and WriteCapacity nodes
- Show capacity consumption metrics
- Add auto-scaling information if configured
