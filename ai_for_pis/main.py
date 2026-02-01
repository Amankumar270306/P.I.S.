from langchain_core.messages import HumanMessage
from agent import app
import sys

def main():
    print("Agentic AI Project Manager (Type 'quit', 'exit', or 'q' to stop)")
    print("---------------------------------------------------------------")
    
    # Initialize chat history if needed, or just let the graph handle state
    # For this simple loop, we keep a local list of messages to pass to the graph
    # However, LangGraph persists state if checkpointer is used, but here we 
    # will just pass the growing list of messages or let the graph handle it per invocation.
    # Since our graph takes a list of messages and returns the *next* message, 
    # we need to maintain history either in the graph or here. 
    # With the current basic setup, we pass the full history.
    
    chat_history = []

    while True:
        try:
            user_input = input("User: ")
            if user_input.lower() in ["quit", "exit", "q"]:
                print("Goodbye!")
                break
            
            chat_history.append(HumanMessage(content=user_input))
            
            # Run the graph
            # The input to the graph is the state, which is a dict with "messages"
            final_state = app.invoke({"messages": chat_history})
            
            # The output 'final_state' contains the updated messages list
            # We update our local history to match the graph's output
            chat_history = final_state["messages"]
            
            # The last message should be from the AI
            last_message = chat_history[-1]
            print(f"AI: {last_message.content}")
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
