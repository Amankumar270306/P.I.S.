"""
Multi-Model LangGraph Agent for P.I.S.
Routes to specialized models based on intent.
"""

import os
from typing import Literal
from sqlalchemy.orm import Session
from functools import partial

from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage, AIMessage

from agent.router import route_intent, RouterOutput
from agent.nodes import (
    AgentState,
    fast_task_node,
    reasoning_node,
    document_node,
    smalltalk_node
)


def create_multi_model_agent(db: Session):
    """
    Create the multi-model LangGraph agent.
    
    Flow:
    START → IntentRouter → [FastTask | Reasoning | Document | Smalltalk] → END
    """
    
    # Wrap nodes with db session
    def router_node(state: AgentState) -> dict:
        """Route intent using phi3:mini."""
        user_input = state.get("user_input", "")
        if not user_input and state.get("messages"):
            # Get from last human message
            for msg in reversed(state["messages"]):
                if isinstance(msg, HumanMessage):
                    user_input = msg.content
                    break
        
        route = route_intent(user_input)
        return {"route": route, "user_input": user_input}
    
    def fast_task_wrapper(state: AgentState) -> dict:
        return fast_task_node(state, db)
    
    def reasoning_wrapper(state: AgentState) -> dict:
        return reasoning_node(state, db)
    
    def document_wrapper(state: AgentState) -> dict:
        return document_node(state, db)
    
    def smalltalk_wrapper(state: AgentState) -> dict:
        return smalltalk_node(state, db)
    
    def route_by_intent(state: AgentState) -> Literal["fast_task", "reasoning", "document", "smalltalk"]:
        """Conditional routing based on intent classification."""
        route = state.get("route")
        if not route:
            return "smalltalk"
        
        # Check for clarification needed
        if route.clarification_needed:
            return "smalltalk"
        
        intent = route.intent
        if intent == "fast_task":
            return "fast_task"
        elif intent == "reasoning":
            return "reasoning"
        elif intent == "document":
            return "document"
        else:
            return "smalltalk"
    
    # Build graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("router", router_node)
    workflow.add_node("fast_task", fast_task_wrapper)
    workflow.add_node("reasoning", reasoning_wrapper)
    workflow.add_node("document", document_wrapper)
    workflow.add_node("smalltalk", smalltalk_wrapper)
    
    # Add edges
    workflow.add_edge(START, "router")
    workflow.add_conditional_edges(
        "router",
        route_by_intent,
        {
            "fast_task": "fast_task",
            "reasoning": "reasoning",
            "document": "document",
            "smalltalk": "smalltalk"
        }
    )
    
    # All nodes end after execution
    workflow.add_edge("fast_task", END)
    workflow.add_edge("reasoning", END)
    workflow.add_edge("document", END)
    workflow.add_edge("smalltalk", END)
    
    return workflow.compile()


def chat_with_agent(user_message: str, db: Session) -> str:
    """
    Main chat function using multi-model LangGraph.
    """
    try:
        agent = create_multi_model_agent(db)
        
        result = agent.invoke({
            "messages": [HumanMessage(content=user_message)],
            "user_input": user_message,
            "route": None,
            "tool_results": None,
            "final_response": None
        })
        
        # Get response
        final_response = result.get("final_response")
        if final_response:
            return final_response
        
        # Fallback to last message
        messages = result.get("messages", [])
        if messages:
            last_msg = messages[-1]
            return last_msg.content if hasattr(last_msg, 'content') else str(last_msg)
        
        return "I processed your request."
        
    except Exception as e:
        error_msg = str(e)
        if "Connection refused" in error_msg or "refused" in error_msg.lower():
            return "🔴 AI is offline. Please start Ollama with: `ollama serve`"
        if "phi3" in error_msg.lower():
            return "🔴 phi3:mini model not found. Run: `ollama pull phi3:mini`"
        return f"Error: {error_msg}"


def simple_chat(user_message: str, db: Session) -> str:
    """Fallback for simple responses."""
    return chat_with_agent(user_message, db)
