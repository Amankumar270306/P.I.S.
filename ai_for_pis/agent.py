from typing import Literal
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage

from state import AgentState
from tools import add_task, add_calendar_task, read_project_status, update_task_status

# Initialize the LLM
llm = ChatOllama(model="llama3.1", temperature=0)

# Bind tools to the LLM
tools = [add_task, add_calendar_task, read_project_status, update_task_status]
llm_with_tools = llm.bind_tools(tools)

def agent_node(state: AgentState):
    """The main agent node that calls the LLM."""
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def should_continue(state: AgentState) -> Literal["tools", "__end__"]:
    """Determines whether to call tools or end the conversation."""
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return "__end__"

# Define the graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(tools))

# Add edges
workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent")

# Compile the graph
app = workflow.compile()
