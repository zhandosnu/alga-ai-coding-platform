FROM gcc:13-bookworm

# Create non-root runner user
RUN useradd -m -u 1001 runner

USER runner
WORKDIR /tmp

# Compile and run C++ code from volume mounted at /code
CMD ["sh", "-c", "g++ -O2 -std=c++17 -o /tmp/solution /code/solution.cpp && /tmp/solution < /code/stdin.txt"]
