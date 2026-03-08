# Neon Struct - Data Structure Visualizer

A comprehensive, interactive data structure visualizer built with React (frontend) and Python Flask (backend). Visualize and understand how various data structures work with real-time animations and step-by-step operation tracking.

## Features

- **Multiple Data Structures**: Singly Linked List, Doubly Linked List, Queue, Double-Ended Queue, Stack, Binary Search Tree, AVL Tree, and Graph
- **Interactive Operations**: Insert, Delete, and Search with animated visualizations
- **Random Data Generation**: Add 7 random values with a single click
- **Graph-Specific Features**: Add edges with custom weights between vertices
- **Operation Tracking**: Real-time display of operation status, step count, and time complexity
- **Collapsible Panels**: Maximize visualization space by collapsing side panels
- **Visual Feedback**: Color-coded nodes (visited = yellow, found = green)
- **Notifications**: Contextual notifications with operation status and guidance
- **Professional UI**: Modern, dark-themed interface with smooth animations

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Canvas API for visualizations
- Lucide React for icons

### Backend
- Python 3.x
- Flask for REST API
- Custom data structure implementations

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8 or higher
- npm or yarn

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Running the Application

1. Start the backend server:
```bash
cd backend
python app.py
```
The backend will run on `http://localhost:5000`

2. Start the frontend development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Select a Data Structure**: Choose from the left panel
2. **Perform Operations**:
   - Enter a value and click Insert/Delete/Search
   - Use "Add 7 Random" to quickly populate the structure
   - For graphs, use the edge controls to connect vertices
3. **Watch Animations**: Operations are animated with step-by-step visualization
4. **Monitor Complexity**: View operation info in the right panel
5. **Toggle Panels**: Click the arrow buttons to collapse/expand side panels

## Data Structures

- **Singly Linked List**: One-way linked nodes
- **Doubly Linked List**: Two-way linked nodes with prev/next pointers
- **Queue**: FIFO (First In First Out)
- **Double-Ended Queue**: Insert/delete from both ends
- **Stack**: LIFO (Last In First Out)
- **Binary Search Tree**: Ordered binary tree
- **AVL Tree**: Self-balancing binary search tree
- **Graph**: Vertices connected by weighted edges

## Coming Soon

- View Code: Display implementation code
- View Pseudo Code: Algorithm pseudocode
- View Algorithm: Detailed algorithm explanations

## Project Structure

```
neon-struct/
├── backend/
│   ├── app.py
│   ├── data_structures/
│   │   ├── base.py
│   │   ├── linked_list.py
│   │   ├── queue.py
│   │   ├── stack.py
│   │   ├── tree.py
│   │   └── graph.py
│   └── utils/
│       └── complexity.py
├── src/
│   ├── components/
│   │   ├── DataStructureSelector.tsx
│   │   ├── VisualizationCanvas.tsx
│   │   ├── OperationPanel.tsx
│   │   ├── NotificationBar.tsx
│   │   ├── dialogs/
│   │   └── visualizations/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── App.tsx
└── docs/

```

## License

MIT License
