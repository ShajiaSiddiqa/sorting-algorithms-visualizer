# Sorting Algorithm Visualizers

An interactive, step-by-step sorting visualizer collection. The `index.html` page is the main entry point with links to every visualizer and a sorting algorithm comparison table.

## Visualizer Pages

- `index.html`
- `quicksort.html`
- `merge-sort.html`
- `heap-sort.html`
- `insertion-sort.html`
- `bubble-sort.html`
- `selection-sort.html`
- `bucket-sort.html`
- `radix-sort.html`
- `counting-sort.html`

Shared assets for the added pages:

- `sorting-theme.css`
- `sorting-visualizer.js`

## Features

- Animated array visualization with comparison, swap, pivot, and sorted states
- Play, pause, restart, single-step, and timeline controls
- Live comparison, write/swap, pass/depth, and element counters
- Highlighted pseudocode for each algorithm
- Custom arrays of up to 12 numbers
- Adjustable animation speed
- Main page with a linked algorithm list and comparison table
- Shared soft visual theme across all sorting pages
- Algorithm-appropriate visual layouts:
  - Heap Sort uses a balanced binary tree view
  - Merge Sort uses array/range rows
  - Counting, Radix, and Bucket Sort use count/bucket/output views
- Each page includes when to use the algorithm, practical use cases, and applications

Quick Sort also includes:

- A "When to use Quick Sort" guide above its complexity table
- Dynamic recursion tree and call-stack display
- Five pivot strategies:
  - Last element
  - First element
  - Middle element
  - Median of three
  - Random element
- Responsive layout and reduced-motion support




## Run Locally

No build step or package installation is required.

1. Clone or download this project.
2. Open `index.html` in a modern web browser, or open any visualizer HTML file directly.

You can also serve it locally:

```bash
python3 -m http.server 8000
```

Then visit:

To get all Algorithms

- [http://localhost:8000/index.html](http://localhost:8000/index.html)

or individually

- [http://localhost:8000/quicksort.html](http://localhost:8000/quicksort.html)
- [http://localhost:8000/merge-sort.html](http://localhost:8000/merge-sort.html)
- [http://localhost:8000/heap-sort.html](http://localhost:8000/heap-sort.html)
- [http://localhost:8000/insertion-sort.html](http://localhost:8000/insertion-sort.html)
- [http://localhost:8000/bubble-sort.html](http://localhost:8000/bubble-sort.html)
- [http://localhost:8000/selection-sort.html](http://localhost:8000/selection-sort.html)
- [http://localhost:8000/bucket-sort.html](http://localhost:8000/bucket-sort.html)
- [http://localhost:8000/radix-sort.html](http://localhost:8000/radix-sort.html)
- [http://localhost:8000/counting-sort.html](http://localhost:8000/counting-sort.html)

> The page loads its fonts from Google Fonts, so an internet connection is needed for the intended typography. The visualizer itself runs entirely in the browser.

## How to Use

1. Open the sorting algorithm page you want to study.
2. Press **Play** to run the visualization automatically.
3. Use **Back**, **Step**, or the timeline slider to inspect individual operations.
4. Adjust the speed slider as needed.
5. Enter your own comma- or space-separated values and press **Sort it**.

For Quick Sort, you can also select a pivot strategy.

Custom input must contain at least two numbers. Most visualizers accept up to 12 values in the range `0–120`; Counting Sort is capped at `0–20` for readable count buckets, and Radix Sort accepts values up to `999`.

### Keyboard Controls

| Key | Action |
| --- | --- |
| `Space` | Play or pause |
| `Right Arrow` | Move to the next step |
| `Left Arrow` | Move to the previous step |
| `Enter` | Submit a custom array while its input is focused |

You can also click or focus an array bar to inspect its current role.

## Algorithm

The visualizer uses the Lomuto partition scheme:

1. Choose a pivot and move it to the end of the active range.
2. Scan the range with pointer `j`.
3. Move values less than or equal to the pivot behind boundary `i`.
4. Place the pivot between the two partitions.
5. Recursively sort the left and right partitions.

Alternative pivot strategies still move the selected pivot to the end before applying the same partition process.

## Complexity

| Case | Time |
| --- | --- |
| Best | `O(n log n)` |
| Average | `O(n log n)` |
| Worst | `O(n²)` |
| Auxiliary space | `O(log n)` average recursion stack |

Quick Sort is an in-place, comparison-based algorithm, but it is not stable. Poor pivot choices can produce the quadratic worst case.

## Algorithm Comparison

| Algorithm   | Average    | Worst      | Space    | Stable |
| ----------- | ---------- | ---------- | -------- | ------ |
| Quick Sort  | O(n log n) | O(n²)      | O(log n) | NO     |
| Merge Sort  | O(n log n) | O(n log n) | O(n)     | YES    |
| Heap Sort   | O(n log n) | O(n log n) | O(1)     | NO     |
| Insertion Sort | O(n²)   | O(n²)      | O(1)     | YES    |
| Bubble Sort | O(n²)      | O(n²)      | O(1)     | YES    |
| Selection Sort | O(n²)   | O(n²)      | O(1)     | NO     |
| Bucket Sort | O(n + k) avg | O(n²)    | O(n + k) | Depends |
| Radix Sort | O(d(n + b)) | O(d(n + b)) | O(n + b) | YES |
| Counting Sort | O(n + k) | O(n + k) | O(k) | Can be stable |


## Learning Objectives

This project helps students understand:

- Divide and Conquer Algorithms
- Recursive Problem Solving
- Partitioning Techniques
- Pivot Selection Strategies
- Algorithm Complexity Analysis
- Recursion Trees
- Sorting Algorithm Visualization

### Perfect for:

- Data Structures & Algorithms courses
- Programming Labs
- Algorithm Demonstrations
- Technical Interviews Preparation
- Self-Learning

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Inline SVG for controls and the recursion tree

No frameworks or external JavaScript dependencies are used.

## Browser Support

Use a current version of Chrome, Firefox, Edge, or Safari. The application relies on modern browser features including `IntersectionObserver`, CSS custom properties, and SVG.
