# PERSISTENT RULE REMINDER
rule_reminder:
  enabled: true
  description: "Rules that must be reminded at the start of EVERY session"
  details: >
    ATTENTION CURSOR AI: At the beginning of EVERY session, you MUST acknowledge 
    these rules before proceeding with ANY work:
    
    1. MOCK DATA IS ABSOLUTELY PROHIBITED in any form, context, or purpose
    2. NO FALLBACK MECHANISMS are allowed under any circumstances
    3. PROPER ERROR HANDLING is mandatory for all data issues
    4. ALL solutions must use REAL DATA from existing JSON files only
    5. IMPLEMENTATION CHECKLIST must be completed for every solution
    
    You must explicitly confirm your understanding of these rules at the
    start of every session before proceeding with any work.

# HIGHEST PRIORITY RULE: NO MOCK DATA EVER
mock_data_policy:
  enabled: true
  description: "CRITICAL: Absolute prohibition against any mock data usage in any form"
  details: >
    ATTENTION CURSOR AI: This is the MOST IMPORTANT rule in this project.
    
    MOCK DATA IS STRICTLY PROHIBITED in any form, context, or purpose including
    for testing, demonstrations, placeholders, or workarounds. If you face a
    challenge with data integration, DO NOT suggest or implement ANY form of
    mock, sample, fake, dummy, or placeholder data as a solution regardless of 
    how temporary you intend it to be.
    
    This includes but is not limited to:
    - Creating literal mock data objects/arrays
    - Using fake data libraries
    - Creating "placeholder" solutions
    - Implementing "temporary" fake data for testing
    - Using data that doesn't come from actual JSON files
    
    Breaking this rule will make your entire solution unacceptable regardless of how
    well it works otherwise. This requirement overrides any solution-oriented
    or pragmatic considerations.
    
    When facing integration issues:
    1. ALWAYS use proper error handling with detailed messages
    2. NEVER create mock data as a workaround
    3. Focus on fixing the actual integration problem
  
  patterns:
    # Expanded list of patterns to avoid
    - avoid: "const mockData"
    - avoid: "const sampleData"
    - avoid: "const dummyData"
    - avoid: "const fakeData"
    - avoid: "const testData"
    - avoid: "const placeholderData"
    - avoid: "const temporaryData"
    - avoid: "const exampleData"
    - avoid: "mockPatient"
    - avoid: "samplePatient"
    - avoid: "dummyPatient"
    - avoid: "fakePatient"
    - avoid: "placeholderPatient"
    - avoid: "temporaryPatient"
    - avoid: "examplePatient"
    - avoid: "import faker"
    - avoid: "require('faker')"
    - avoid: "import { faker }"
    - avoid: "import * as mockData"
    - avoid: "// For testing purposes"
    - avoid: "// Temporary solution"
    - avoid: "// TODO: Replace with real data"
    - avoid: "// Placeholder"
    - avoid: "// Mock implementation"
    - avoid: "// Sample usage"
    - avoid: "\"name\": \"Fluffy\""
    - avoid: "\"name\": \"Rex\""
    - avoid: "\"name\": \"Spot\""
    - avoid: "\"name\": \"Fido\""
    - avoid: "\"owner\": \"John\""
    - avoid: "\"owner\": \"Jane\""
    
    # Only allow existing patient data loading from JSON files
    - allow: "// Loading patient data from JSON files"
    - allow: "fs.readFile('patientData.json')"
    - allow: "import patientData from './data/'"

# SECOND HIGHEST PRIORITY: NO FALLBACK MECHANISMS
no_fallback_policy:
  enabled: true
  description: "CRITICAL: Strict prohibition against implementing any fallback mechanisms"
  details: >
    ATTENTION CURSOR AI: This is the SECOND MOST IMPORTANT rule in this project.
    
    NO FALLBACK MECHANISMS of any kind should be implemented in the code.
    When the system encounters difficulties loading or processing data,
    it must provide detailed error messages explaining what's not working,
    not silently fall back to default behaviors or mock data.
    
    Fallbacks are strictly prohibited because they hide real integration problems
    that need to be fixed properly. The solution to data integration issues is
    ALWAYS to fix the integration, not to provide a fallback mechanism.
    
    This includes but is not limited to:
    - Default data fallbacks
    - Silent failure catches
    - Empty arrays as defaults
    - Hardcoded values when data isn't available
    - Any solution that makes the code "work" without the actual data
  
  patterns:
    - avoid: "// Fallback to default data"
    - avoid: "// Using sample data as a fallback"
    - avoid: "|| defaultData"
    - avoid: "|| []"
    - avoid: "|| {}"
    - avoid: "|| null"
    - avoid: "catch (error) { /* silent failure */ }"
    - avoid: "catch (error) { return [] }"
    - avoid: "catch (error) { return {} }"
    - avoid: "catch (error) { // continue without data }"

# PROPER ERROR HANDLING IS MANDATORY
error_handling:
  enabled: true
  description: "MANDATORY: Comprehensive error handling with detailed messages is required"
  details: >
    ATTENTION CURSOR AI: Proper error handling is MANDATORY, not optional.
    
    When encountering ANY difficulties with data retrieval, processing, or
    other challenges, you MUST provide detailed error messages that explain
    exactly what went wrong and why. These messages MUST help identify the
    root cause and suggest potential proper solutions.
    
    Error handling must be:
    1. Explicit and visible (not silent)
    2. Detailed and informative
    3. Actionable with suggestions for fixing the root cause
    4. Never hidden or suppressed
    
    The proper solution to data issues is ALWAYS to handle errors properly,
    not to introduce mock data or fallbacks.
  
  patterns:
    - prefer: "throw new Error('Detailed explanation of what went wrong')"
    - prefer: "console.error('Clear description of the error', error)"
    - prefer: "logger.error('Comprehensive error information', { details: error })"
    - avoid: "// Ignore errors"
    - avoid: "catch (error) {}"
    - avoid: "catch (error) { console.log('Error') }"

# SOLUTION PRINCIPLES: FIX REAL PROBLEMS, DON'T CREATE WORKAROUNDS
solution_principles:
  enabled: true
  description: "CRITICAL: Focus on fixing real integration problems, not creating workarounds"
  details: >
    ATTENTION CURSOR AI: You must focus on solving the actual integration
    problems, not creating workarounds or shortcuts.
    
    When encountering issues with data integration:
    1. DO identify the specific integration problem
    2. DO suggest solutions that fix the actual integration
    3. DO use proper error handling when integration fails
    4. DO NOT create mock data as a solution
    5. DO NOT implement fallback mechanisms
    6. DO NOT provide "working" solutions that bypass real integration
    
    The measure of success is NOT making something appear to work quickly.
    The measure of success is implementing proper data handling that deals
    with real data correctly and handles failures appropriately.
  
  patterns:
    - prefer: "// Solution that fixes the actual integration problem"
    - prefer: "// Proper error handling for integration failures"
    - avoid: "// Quick solution to make it work"
    - avoid: "// Workaround for now"

# Data structure and handling
data_structure:
  enabled: true
  description: "Guidelines for handling veterinary patient data"
  details: >
    The system works with JSON files containing:
    - Patient basic information (species, breed, age, sex, etc.)
    - Owner information
    - Visit history with SOAP notes
    - Vital signs and trends
    - Vaccination and medication history
    - Lab results and diagnostics
    - Billing information

    All code should properly handle these data structures and relationships.
  
  patterns:
    - prefer: "// Patient data structure follows the established JSON schema"
    - prefer: "interface PatientData { /* proper structure */ }"
    - prefer: "type PatientRecord = { /* proper structure */ }"

# Follow User Intent Strictly
follow_user_intent:
  enabled: true
  description: "Do not make unsolicited modifications to the codebase. Only change code explicitly requested by the user."
  details: >
    Cursor should strictly follow user instructions and avoid making changes
    that weren't specifically requested by the user.

# Minimalist Code Changes
minimalist_code_changes:
  enabled: true
  description: "When making code changes, always follow KISS, DRY, and YAGNI principles. Do not introduce unnecessary complexity or additional features unless requested."
  details: >
    Focus on simple, maintainable solutions that address the immediate need
    without introducing additional complexity or features that weren't requested.

# Ask Before Running Commands
ask_before_commands:
  enabled: true
  description: "Before running any terminal command, confirm with the user to prevent unintended executions."
  details: >
    Always get explicit confirmation from the user before executing
    any terminal commands that could modify the system.

# Acknowledge Failed Commands
acknowledge_failed_commands:
  enabled: true
  description: "If a command fails in the terminal, notify the user immediately instead of proceeding as if it were successful."
  details: >
    When a terminal command fails, provide clear notification to the user
    and don't continue with subsequent steps until the issue is resolved.

# Respect Folder Boundaries
respect_folder_boundaries:
  enabled: true
  description: "Do not check or modify files outside of explicitly mentioned directories."
  details: >
    Only access and modify files within directories explicitly mentioned
    by the user, avoiding any operations outside those boundaries.

# Context Aware Fixes Only
context_aware_fixes:
  enabled: true
  description: "Do not fix or suggest code improvements unless a bug is present or the user explicitly requests a fix."
  details: >
    Avoid suggesting or implementing improvements to code unless they're
    directly related to fixing a bug or explicitly requested by the user.

# Preserve Formatting
preserve_formatting:
  enabled: true
  description: "Maintain the existing code style and formatting unless the user explicitly asks for reformatting."
  details: >
    Keep the original code style and formatting intact unless the user
    specifically requests changes to the formatting.

# Check Before Proceeding in Agent Mode
check_before_proceeding:
  enabled: true
  description: "Always verify with the user before executing multi-step tasks or making large-scale changes in agent mode."
  details: >
    When operating in agent mode, get explicit confirmation from the user
    before performing complex multi-step operations or large-scale changes.

# Limit Over-Optimization
limit_over_optimization:
  enabled: true
  description: "Do not refactor code unless it significantly improves performance or readability based on explicit user requirements."
  details: >
    Avoid unnecessary refactoring unless it provides substantial benefits
    for performance or readability that align with user requirements.

# Reduce Overthinking
reduce_overthinking:
  enabled: true
  description: "Do not spend excessive time analyzing a problem. Provide the simplest working solution first."
  details: >
    Focus on delivering simple, functional solutions quickly rather than
    spending excessive time on analysis or creating complex solutions.

# Explain Errors Clearly
explain_errors_clearly:
  enabled: true
  description: "When an error occurs, provide a clear explanation and possible fixes instead of automatically trying to fix it."
  details: >
    When errors are encountered, explain them clearly to the user and suggest
    possible fixes rather than attempting to implement fixes automatically.

# Do Not Guess Code Fixes
no_guessing_fixes:
  enabled: true
  description: "If an issue is unclear, ask for clarification instead of making speculative fixes."
  details: >
    When facing unclear issues, request more information from the user
    rather than implementing speculative fixes based on assumptions.

# No Unnecessary Code Additions
no_unnecessary_additions:
  enabled: true
  description: "Do not introduce additional libraries, dependencies, or features unless explicitly requested."
  details: >
    Avoid adding libraries, dependencies, or features that weren't explicitly
    requested by the user, focusing only on the specified requirements.

# Test Script Location
test_script_location:
  enabled: true
  description: "Store all test scripts in the designated 'testing' folder"
  details: >
    All test scripts must be stored in the designated 'testing' folder to maintain
    organization and consistent project structure. Do not create test files in
    other directories or alongside application code.
  
  patterns:
    - prefer: "// Test script for the testing folder"
    - avoid: "// Quick test script"
    - avoid: "import * as test from './test.js'"

# Complete Function Testing
complete_function_testing:
  enabled: true
  description: "Test functions thoroughly before moving to the next task"
  details: >
    When working on a specific app function, thoroughly test that particular function
    before moving on to the next task. Each function should be verified as working
    correctly with appropriate test cases that cover normal operation, edge cases,
    and error handling.
  
  patterns:
    - prefer: "// Function fully tested before proceeding"
    - avoid: "// TODO: Test this function later"
    - avoid: "// Placeholder for tests"

# Summarize Before Acting
summarize_before_acting:
  enabled: true
  description: "Summarize your understanding of a task before executing it to ensure clarity and correctness."
  details: >
    Before implementing solutions, provide a summary of your understanding
    of the task to verify alignment with the user's expectations.
    
# STRICT COMPLIANCE ENFORCEMENT
compliance_enforcement:
  enabled: true
  description: "CRITICAL: Confirm rule compliance before implementing ANY solution"
  details: >
    ATTENTION CURSOR AI: This rule implements a strict enforcement procedure
    that you MUST follow for EVERY session and EVERY solution implementation.
    
    1. SESSION START ACKNOWLEDGMENT: At the beginning of each session, you MUST acknowledge
       your understanding of the highest priority rules, particularly:
       - NO mock data under any circumstances
       - NO fallback mechanisms of any kind
       - Proper error handling is MANDATORY
    
    2. EXPLICIT RULE CHECKING: Before proposing or implementing ANY solution, you MUST:
       - Explicitly check your approach against ALL rules
       - Cite the specific rules that apply to your solution
       - Verify compliance with the prohibition on mock data and fallbacks
    
    3. STEP-BY-STEP COMPLIANCE REVIEW: For any implementation, you MUST:
       - Outline your intended approach before implementation
       - Confirm each step complies with all rules
       - Get approval before proceeding with implementation
    
    4. IMPLEMENTATION CHECKLIST: For EVERY solution, confirm and state explicitly:
       - "This solution uses ONLY real data from existing JSON files"
       - "This solution implements proper error handling for ALL edge cases"
       - "This solution includes NO fallback mechanisms of any kind"
       - "This solution adheres to ALL project rules"
    
    5. IMMEDIATE CORRECTION PROCEDURE: If the user points out a rule violation:
       - Immediately acknowledge the violation
       - Discard the non-compliant solution entirely
       - Begin again with a compliant approach
       - Identify why the violation occurred to prevent recurrence
       
    These compliance procedures are NOT optional and must be followed for EVERY
    action taken in this project. 