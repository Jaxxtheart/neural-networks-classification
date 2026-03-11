# CLAUDE.md — AI Assistant Guide for neural-networks-classification

## Project Overview

This is an educational hackathon project submitted for the **Hult Data Analytics Club**. The goal was to implement neural networks **from scratch using only NumPy** in Python — no deep learning frameworks (TensorFlow, PyTorch, Keras, etc.) are used.

The project follows the [Sentdex YouTube tutorial series](https://www.youtube.com/c/sentdex) on building neural networks from scratch.

**Team Members:** Ali Mir, Vishal Lingineni, Mosiuwa Tshabalala, Andres Restrepo

---

## Repository Structure

```
neural-networks-classification/
├── README.md               # Project overview and team info
├── CLAUDE.md               # This file — AI assistant guide
└── Team_15_Final.ipynb     # Main project code (Jupyter notebook)
```

There are no build scripts, test frameworks, CI/CD pipelines, requirements files, or `.gitignore`. The entire project lives in a single Jupyter notebook.

---

## Technology Stack

| Tool | Purpose |
|------|---------|
| Python | Primary language |
| NumPy | All numerical computation (matrix ops, gradient math) |
| OpenCV (`cv2`) | Image loading and preprocessing |
| Jupyter Notebook | Interactive development and presentation |
| urllib / zipfile | Downloading and extracting the Fashion MNIST dataset |

**Key constraint:** Deep learning frameworks (TensorFlow, PyTorch, etc.) are intentionally excluded. All neural network math is implemented manually using NumPy.

---

## Codebase Architecture

All code lives in `Team_15_Final.ipynb`. The notebook implements a modular object-oriented neural network library with the following components:

### Layer Classes (`Layer_*`)

| Class | Description |
|-------|-------------|
| `Layer_Input` | Stub input layer — passes data through in the forward pass |
| `Layer_Dense` | Fully connected layer with `weights`, `biases`; supports forward and backward passes |

### Activation Function Classes (`Activation_*`)

| Class | Description |
|-------|-------------|
| `Activation_ReLU` | ReLU activation with forward and backward propagation |
| `Activation_Softmax` | Softmax activation; uses Jacobian matrix in backward pass |
| `Activation_Softmax_Loss_CategoricalCrossentropy` | Combined Softmax + Cross-entropy for numerically stable gradient calculation |

### Loss Classes (`Loss_*`)

| Class | Description |
|-------|-------------|
| `Loss_CategoricalCrossentropy` | Categorical cross-entropy loss for multi-class classification |

### Optimizer Classes (`Optimizer_*`)

| Class | Description |
|-------|-------------|
| `Optimizer_SGD` | SGD with optional learning rate decay and momentum |

### Accuracy Classes (`Accuracy_*`)

| Class | Description |
|-------|-------------|
| `Accuracy` | Base class for computing accuracy |
| `Accuracy_Categorical` | Accuracy for categorical (multi-class) predictions |

### Dataset Utilities

| Function | Description |
|----------|-------------|
| `download_minist_dataset()` | Downloads Fashion MNIST from the internet |
| `load_mnist_dataset()` | Loads images from disk using OpenCV |
| `create_data_mnist()` | Creates train/test splits as NumPy arrays |

---

## Standard Method Conventions

All neural network components follow a consistent interface:

```python
class Component:
    def forward(self, inputs):
        # Compute and store self.output
        ...

    def backward(self, dvalues):
        # Compute and store self.dinputs (gradient w.r.t. inputs)
        ...
```

Additional conventions:
- **`.predict(outputs)`** — Convert raw outputs to class predictions (used by Accuracy classes)
- **`.update_params(layer)`** — Update layer weights/biases using computed gradients (used by optimizers)

---

## Data Handling Conventions

- All data stored as **NumPy arrays**
- **Input normalization:** `(X - 127.5) / 127.5` — scales pixel values to the range `[-1, 1]`
- **Labels:** Integer class indices (sparse encoding), not one-hot vectors
- One-hot conversion is handled internally inside the loss backward pass
- **Dataset:** Fashion MNIST — 20,000 training samples, 4,000 test samples (subsets used)

---

## Training Pattern

The training loop follows this sequential structure:

```python
# Forward pass (in order)
layer1.forward(X)
activation1.forward(layer1.output)
layer2.forward(activation1.output)
loss_activation.forward(layer2.output, y)

# Backward pass (in reverse order)
loss_activation.backward(loss_activation.output, y)
layer2.backward(loss_activation.dinputs)
activation1.backward(layer2.dinputs)
layer1.backward(activation1.dinputs)

# Optimizer step
optimizer.update_params(layer1)
optimizer.update_params(layer2)
```

---

## Numerical Stability Patterns

These patterns are intentional — do not remove them:

- **Softmax overflow prevention:** subtract `max(inputs)` before `exp()` in the forward pass
- **Cross-entropy clipping:** clip predictions to `[1e-7, 1 - 1e-7]` to prevent `log(0)`
- **Combined Softmax+Loss class:** exists specifically to produce a simpler, more stable gradient than computing them separately

---

## Training Results

The network achieves approximately **92.6% training accuracy** and **88.8% test accuracy** on Fashion MNIST after 700 epochs with these hyperparameters:

| Hyperparameter | Value |
|----------------|-------|
| Learning rate | 0.25 |
| Momentum | (default SGD) |
| Epochs | 700 |
| Batch size | Full dataset |

Epoch output format:
```
epoch: 0,   acc: 0.001, loss: 2.303, lr: 0.25
epoch: 100, acc: 0.781, loss: 0.884, lr: 0.25
...
epoch: 700, acc: 0.926, loss: 0.230, lr: 0.25
Test accuracy: 0.8877
```

---

## Development Workflows

### Running the Notebook

Since there is no build system, the workflow is:

1. Open `Team_15_Final.ipynb` in Jupyter Lab or Jupyter Notebook
2. Run cells top-to-bottom (Kernel → Restart & Run All)
3. The notebook will download Fashion MNIST on first run (requires internet)

```bash
# Install dependencies manually
pip install numpy opencv-python jupyter

# Launch Jupyter
jupyter notebook Team_15_Final.ipynb
```

### No Test Suite

There is no automated test suite. Validation is done inline in the notebook:
- Training metrics are printed every 100 epochs
- Final test accuracy is computed on held-out test data at the end

### No Linting or Formatting

There are no linting or formatting tools configured. Code style follows Python conventions loosely.

---

## Key Constraints for AI Assistants

1. **Do not introduce deep learning frameworks.** The explicit constraint of this project is NumPy-only neural network implementation. Do not suggest or add TensorFlow, PyTorch, Keras, JAX, etc.

2. **Preserve the educational structure.** The notebook is meant to demonstrate concepts step by step. Avoid collapsing or heavily abstracting code in ways that hide the underlying math.

3. **Method signatures must stay consistent.** All layer/activation/loss classes must implement `forward(inputs)` and `backward(dvalues)`. Changing these breaks the training loop.

4. **Numerical stability code is intentional.** Do not remove the `max` subtraction in Softmax, the clipping in cross-entropy, or the combined `Activation_Softmax_Loss` class.

5. **No external configuration files required.** This project has no `requirements.txt`, `pyproject.toml`, or similar. If adding dependencies, document them here.

6. **Notebook format.** The primary artifact is a `.ipynb` file. Prefer editing the notebook directly rather than extracting code to `.py` files unless there is a strong reason.

---

## Git Branch

Active development branch: `claude/add-claude-documentation-ofS72`

Remote: `origin` (Jaxxtheart/neural-networks-classification)
