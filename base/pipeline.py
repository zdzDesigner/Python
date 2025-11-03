from transformers import pipeline

classifier = pipeline("sentiment-analysis")
result = classifier("i like this")

print(result)
