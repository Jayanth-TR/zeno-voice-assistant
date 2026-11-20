from app.agents.graph import model

response = model.invoke(
    "Introduce yourself as Zeno in two sentences."
)

print(response.content)