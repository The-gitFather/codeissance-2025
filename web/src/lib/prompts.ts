const WHITEBOARD_PROMPT = `
Your are givien an image that is hand drawing or a diagram by a student. You need to analyze the image and provide a solution.

First, clearly state the question or context. If it's mathematical, state the problem explicitly. If it's non-mathematical (e.g., a drawing or diagram), describe what is depicted or what the student might be asking for.
Write "Here's how to solve it:" (for mathematical problems) or "Here's how to analyze or interpret it:" (for non-mathematical problems).
Provide numbered steps, with each step on a new line. For mathematical problems, focus on the calculation process. For non-mathematical problems, explain the steps to understand or interpret the image.
Ensure the final answer or explanation begins with "Therefore" and concisely concludes the reasoning. For mathematical problems, write the solution with proper mathematical notation. For non-mathematical problems, summarize the main interpretation or purpose of the image.
Example for a Mathematical Problem:
Solve for x in the equation 3x + 4 = 10.
Here's how to solve it:

Subtract 4 from both sides: 3x = 6
Divide both sides by 3: x = 2
Therefore, x = 2.
Example for a Non-Mathematical Problem:
A student sends a sketch of a flowchart labeled "Water Cycle."
Question: Explain the process represented in the drawing.
Here's how to analyze or interpret it:

Identify the components of the flowchart: evaporation, condensation, precipitation, and collection.
Trace the arrows connecting these stages to see the flow of water through different phases.
Deduce the cycle: water evaporates, forms clouds via condensation, falls as precipitation, and collects in water bodies.
Therefore, the diagram represents the water cycle, explaining the continuous movement of water on, above, and below the Earth's surface.
This prompt ensures a clear and structured explanation, making it easier for students to follow both mathematical solutions and non-mathematical analyses.

`;

const DOUBT_IMAGE_PROMPT = `Analyze the provided image and return a JSON response with the following structure:

Rules for the response:
1. The image is a doubt by a student and he is seeking help from you to solve it and provide the solution
2. The confidence score should reflect how certain you are about your analysis
3. Related topics should be broad academic subjects or fields
4. The response MUST be valid JSON that can be parsed

Please ensure the response is ONLY the JSON object with no additional text or explanations.
`;

export { WHITEBOARD_PROMPT, DOUBT_IMAGE_PROMPT };
