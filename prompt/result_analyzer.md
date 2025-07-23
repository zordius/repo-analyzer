# Result Analyzer

Your task is to analyze a collection of individual analysis results, some of which may contain redundant or
overlapping information. The goal is to create a **single, comprehensive, and non-redundant summary** by
de-duplicating and synthesizing findings while ensuring no unique details or associated attributes are lost
during consolidation.

**Instructions for Consolidation:**

1. **Group Findings by Name**:
    * Identify all findings that share the exact same "Finding Name". These are considered instances of the same
      underlying finding.

2. **Consolidate Attributes for Grouped Findings**:
    * For each group of findings with an identical name, create a single consolidated entry.
    * The name of this consolidated entry will be the shared "Finding Name".
    * For each attribute associated with this "Finding Name" across all its instances:
        * Collect all unique values for that attribute.
        * If an attribute appears with different values across instances, list all unique values for that
          attribute (e.g., "Attribute X: value A, value B, value C").
        * If an attribute is present in some instances but not others, include it in the consolidated entry,
          noting its presence where applicable (e.g., "Attribute Y: value Z (present in instance 1)").

3. **Preserve All Unique Information**:
    * Ensure that every unique attribute, sub-attribute, and value from the original findings is comprehensively
      documented in the consolidated summary. No data points should be lost.

4. **Prioritize Clarity and Key Insights**:
    * Synthesize the information to highlight the most significant insights, overarching themes, or critical
      conclusions derived from the consolidated findings. Present this information concisely.

**Output Structure**:

* Generate a detailed, organized summary in **Markdown format**.
* Start your output with the text `---ANALYSIS-START---`.
* Use clear headings (e.g., `## Consolidated Analysis Results`).
* For each consolidated finding, use a main bullet point (`* **Finding Name**`) followed by sub-bullets for
  attributes and their values (`- Attribute: value`).
* If an attribute has multiple unique values from merged findings, list all of them
  (e.g., `- Attribute: value A, value B`).
* If an attribute was only present in some instances, clarify its origin if necessary for understanding.

**Input Example**:

```markdown
## Analysis Results

* **Finding Name 1**
    - Attribute 1: value A
    - Attribute 2: value B

* **Finding Name 1**
    - Attribute 1: value A
    - Attribute 2: value B

* **Finding Name 2**
    - Attribute 1: value C
    - Attribute 2: value D

* **Finding Name 2**
    - Attribute 1: value C
    - Attribute 3: value E
```

**Expected Output Example**:

```markdown
---ANALYSIS-START---

## Consolidated Analysis Results

* **Finding Name 1**
    - Attribute 1: value A
    - Attribute 2: value B

* **Finding Name 2**
    - Attribute 1: value C
    - Attribute 2: value D
    - Attribute 3: value E
```
