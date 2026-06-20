import type { KnowledgeArticle } from "@/types";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "kb-1",
    title: "Existing Building Survey Checklist",
    category: "Survey",
    summary: "Standard field survey protocol for documenting existing building conditions before renovation.",
    content: `## Pre-Survey Preparation
- Gather all available as-built drawings
- Review historical renovation records
- Confirm access permissions and safety protocols

## On-Site Documentation
1. **Exterior**: Facade condition, roof, windows, drainage
2. **Structure**: Visible cracks, spalling, corrosion, deflection
3. **Interior**: Partitions, finishes, moisture damage
4. **MEP**: Equipment age, capacity, distribution routes
5. **Fire & Access**: Egress paths, fire separation, accessibility

## Deliverables
- Annotated photo log with location tags
- Measured drawings where drawings are missing
- Preliminary condition summary report`,
    tags: ["survey", "checklist", "field-work"],
    updatedAt: daysAgo(14),
  },
  {
    id: "kb-2",
    title: "Adaptive Reuse Strategy Framework",
    category: "Strategy",
    summary: "Decision framework for evaluating adaptive reuse approaches on existing buildings.",
    content: `## Evaluation Dimensions
- **Structural capacity** for new program loads
- **Spatial flexibility** of existing layout
- **Envelope performance** and upgrade potential
- **Heritage and character** value
- **Regulatory path** for occupancy change

## Strategy Types
1. Light renewal — minimal intervention
2. Medium renovation — targeted upgrades
3. Deep recreation — comprehensive transformation
4. Adaptive reuse — program-driven reconfiguration

## Decision Criteria
Match strategy to owner goals, budget level, timeline, and risk tolerance.`,
    tags: ["strategy", "adaptive-reuse", "framework"],
    updatedAt: daysAgo(21),
  },
  {
    id: "kb-3",
    title: "Concrete Structure Assessment Guide",
    category: "Structure",
    summary: "Guidance for assessing aging reinforced concrete structures in renovation projects.",
    content: `## Common Issues in Pre-2000 Buildings
- Carbonation of concrete cover
- Rebar corrosion and spalling
- Insufficient seismic detailing
- Unknown material properties

## Assessment Methods
- Visual inspection and hammer testing
- Cover meter and half-cell potential
- Core sampling for strength verification
- Non-destructive testing (UPV, GPR)

## When to Engage Structural Engineer
- Any exposed rebar or significant cracking
- Proposed floor openings or load changes
- Occupancy change with higher live loads
- Heritage buildings with alteration restrictions`,
    tags: ["structure", "concrete", "assessment"],
    updatedAt: daysAgo(7),
  },
  {
    id: "kb-4",
    title: "Renovation Document Archive Standards",
    category: "Documents",
    summary: "Recommended document categories and naming conventions for renovation project archives.",
    content: `## Required Categories
- Old drawings (architectural, structural, MEP)
- Survey photos and field notes
- Structure inspection reports
- MEP as-built documentation
- Historical and heritage records
- Cost and schedule documents

## Naming Convention
\`[ProjectCode]_[Category]_[Description]_[Date]\`

Example: \`RC-XA-1986-001_Facade_SouthSurvey_202605\`

## Quality Standards
- Minimum 300 DPI for scanned drawings
- GPS-tagged photos where applicable
- Version control for updated documents`,
    tags: ["documents", "archive", "standards"],
    updatedAt: daysAgo(30),
  },
  {
    id: "kb-5",
    title: "Fire Safety Upgrade for Occupancy Change",
    category: "Compliance",
    summary: "Key fire safety considerations when changing building occupancy in renovation projects.",
    content: `## Trigger Events
- Change from office to assembly/cultural use
- Increased occupant load
- New vertical openings or atrium spaces

## Typical Requirements
- Egress width and travel distance compliance
- Fire compartmentation review
- Detection and alarm system upgrade
- Sprinkler system evaluation

## Process
1. Code analysis for target occupancy
2. Fire engineering assessment
3. Compliance gap report
4. Design integration with architectural scheme`,
    tags: ["fire-safety", "compliance", "occupancy"],
    updatedAt: daysAgo(10),
  },
  {
    id: "kb-6",
    title: "Facade Renewal Options for 1980s Buildings",
    category: "Facade",
    summary: "Comparison of facade renewal approaches for aging tile-clad concrete buildings.",
    content: `## Common 1980s Facade Issues
- Ceramic tile debonding and spalling
- Failed sealants and water ingress
- Single-glazed aluminum windows
- No thermal insulation

## Renewal Options
1. **Repair in kind** — replace tiles, lowest cost
2. **Over-cladding** — new layer over existing, improves energy
3. **Curtain wall replacement** — highest performance, highest cost
4. **Perforated screen** — preserves structure, new identity

## Selection Factors
Budget, design intent, energy targets, construction access, heritage constraints.`,
    tags: ["facade", "renewal", "1980s"],
    updatedAt: daysAgo(5),
  },
];
