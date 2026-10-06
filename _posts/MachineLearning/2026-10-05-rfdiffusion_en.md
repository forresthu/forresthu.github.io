---

layout: post
title: "RFdiffusion: Diffusion Models on Protein Structure"
category: Architecture
tags: MachineLearning
keywords: RFdiffusion diffusion model protein design SE3 self-conditioning
description: RFdiffusion from an ML angle - diffusion on the SE(3) manifold, fine-tuning a pretrained structure predictor into a denoiser, how conditioning is injected, and evaluating designs with a round-trip metric.
lang: en
image: /public/upload/og/rfdiffusion-en.png
translation_url: /2026/10/05/rfdiffusion.html
translation_lang: zh-CN

---

> 中文版 / Chinese version: [RFdiffusion：把扩散模型搬到蛋白质结构上](/2026/10/05/rfdiffusion.html)

## TL;DR

[RFdiffusion](https://www.nature.com/articles/s41586-023-06415-8) (Watson et al., *Nature* 620, 1089–1100, 2023) usually gets introduced as "Stable Diffusion for protein design." The analogy is half right: it is a DDPM, it does generate structures from noise under conditioning, and the code is [on GitHub](https://github.com/RosettaCommons/RFdiffusion) under a BSD license.

But the parts worth an ML engineer's attention are exactly the ones where it had to **differ** from image diffusion: the data doesn't live in Euclidean space, there's no FID to lean on, and the denoiser wasn't trained from scratch — it's a pretrained **discriminative** structure predictor converted into a generative model.

These notes cover the ML side only: how the problem is formalized, how the network is built, how conditioning is injected, how results are judged, and what transfers elsewhere. I'm not qualified to write about why de novo protein design matters biologically, so I won't.

## 1. The data isn't pixels — it's a pile of rigid bodies

Image diffusion operates on an $$H \times W \times 3$$ tensor, and noising is per-pixel Gaussian. Clean and simple. Protein backbones aren't like that.

RFdiffusion represents each residue as a **rigid frame**:

- a translation: the 3D coordinate of the Cα atom, $$x \in \mathbb{R}^3$$
- a rotation: the orientation defined by its N–Cα–C atoms, $$R \in SO(3)$$

First, the atom names. A protein is a chain of amino acids, and every amino acid (residue) contributes the same three backbone atoms in the same order, N → Cα → C:

```text
       R₁              R₂              R₃        <- side chains (what makes
       |               |               |            the 20 amino acids differ)
 - N - Cα - C --- N - Cα - C --- N - Cα - C -
            ||              ||              ||
            O               O               O
```

**Cα (the alpha carbon) is the central carbon of each residue.** Four things attach to it: the backbone N, the backbone C, a hydrogen, and the **side chain** that determines which amino acid this is. So it sits exactly at the branch point where the variable part hangs off the invariant backbone. Structural biology has long used Cα as the stand-in for "where a residue is" (the Cα trace), and RMSD between structures is conventionally computed over Cα atoms. Coordinates are in ångströms (Å, 0.1 nm), and consecutive Cα atoms sit about 3.8 Å apart — a nearly constant spacing.

> A useful analogy: this is skeletal rigging from 3D animation. The Cα coordinates are **joint positions**, the N–Cα–C triangle gives each **joint's orientation**, and the backbone is a kinematic chain with fixed bone lengths. "One position plus one rotation per joint" is the natural state representation.

Why frames instead of raw atom coordinates? Partly cost: a residue has 7–24 atoms, and diffusing over all-atom coordinates is heavy. Partly because backbone bond lengths and angles are nearly rigid, so the degrees of freedom that actually vary are each residue's **position and orientation** — and orientation is what decides where the side chain points and how residues pack against each other. It's also the representation AlphaFold2 and RoseTTAFold use internally, which matters in the next section.

Take the rotation half first. $$SO(3)$$ (the special orthogonal group) is the set of **all rotations about the origin** in 3D — concretely, the 3×3 matrices satisfying

$$
R^\top R = I, \qquad \det R = +1
$$

Orthogonality means it only rotates: lengths and angles are preserved, nothing stretches or shears. The determinant being +1 rather than −1 rules out **mirror flips**, which is what "special" means in the name. That isn't a detail for proteins: proteins are chiral, and a mirrored protein is not the same molecule.

Nine numbers go in, but $$R^\top R = I$$ imposes six constraints, so $$SO(3)$$ has only **three degrees of freedom** (Euler angles, axis–angle and unit quaternions are different parameterizations of it). It's a group: multiplication is the matrix product, the inverse is the transpose. One more property matters later — it is **compact**: "all possible orientations" is a finite-sized space, so a uniform distribution over it exists.

Now attach the translation. A rotation-plus-translation is a rigid motion of 3D space, and those motions form the group $$SE(3)$$ (the special Euclidean group), whose elements can be written as a 4×4 matrix:

$$
\begin{pmatrix} R & x \\ 0 & 1 \end{pmatrix}, \qquad R \in SO(3),\; x \in \mathbb{R}^3
$$

Six degrees of freedom in total: 3 rotational + 3 translational.

So a chain of length $$L$$, carrying one frame per residue, lives in the Cartesian product of $$L$$ copies of $$SE(3)$$ — that is $$SE(3)^L$$, not $$\mathbb{R}^{3L}$$. A 150-residue protein is a single point in that 900-dimensional space.

The key difference: $$SE(3)^L$$ is a **curved manifold (a Lie group)**, not a vector space. You can't add — summing two rotation matrices elementwise doesn't produce a rotation — and "taking a small step" requires the manifold's exponential and log maps. Two consequences follow.

**First, the noise process has to follow the manifold.** Translations can borrow 3D Gaussian noise directly. Rotations can't: add Gaussian noise to the nine entries of a rotation matrix and it stops being a rotation. The paper instead runs Brownian motion on the $$SO(3)$$ manifold — the IGSO(3) distribution, which is what a Gaussian becomes on the rotation manifold. The two halves don't even end in the same place: because $$SO(3)$$ is compact, fully noised rotations converge to a **uniform distribution over all orientations**, while translations land in a familiar Gaussian. The forward process runs 200 steps.

**Second, the network has to be equivariant.** Rotate and translate the whole protein and it's still the same protein, so the output should transform with it. That's why RFdiffusion relies on SE(3)-equivariant transformer layers (the `SE(3)-Transformers` package you install separately via conda). Symmetry you can paper over with data augmentation in vision is a hard constraint here.

> A takeaway worth keeping: **the design of the noise distribution is dictated by the geometry of the data manifold, not by convenience.** When your data is angles, rotations, distributions on a simplex, or discrete tokens, "add Gaussian noise" is the step that needs rethinking.

## 2. The denoiser: fine-tune a pretrained structure predictor

This is, to me, the most important decision in the paper.

RFdiffusion's denoiser isn't a freshly designed U-Net. It's [RoseTTAFold](https://www.science.org/doi/10.1126/science.abj8754) — the structure prediction network contemporary with AlphaFold2 — with **minimal architectural changes**, initialized from pretrained weights and fine-tuned on the denoising task.

The paper runs a blunt ablation: for an equal amount of training, fine-tuning from pretrained weights was "far more successful" than training from untrained weights (Fig. 2F).

Why is that interesting? RoseTTAFold is a **discriminative** model: sequence in, structure out. RFdiffusion needs a **generative** one. The training objectives are entirely different, but they share one body of knowledge: *what a three-dimensional arrangement has to look like to be a plausible protein*. How secondary structure packs, how a hydrophobic core fills, how a chain folds back on itself — that prior is already compressed into RoseTTAFold's weights, and the generative model has no need to relearn it.

It's the same move as initializing from a pretrained backbone in CV or NLP, but it crosses the discriminative↔generative boundary, which is more aggressive than typical transfer learning. If you have a predictor that works well in some domain and you want to generate in that domain, try this first.

## 3. Predict the clean structure, not the noise — and don't align the loss

Two details, both departing from standard diffusion practice.

**Prediction target.** Image diffusion mostly predicts the noise $$\epsilon$$ (or v-prediction). RFdiffusion predicts the **final clean structure** $$x_0$$ at every step, then takes a step toward that prediction and adds a little noise back to form the next input. The choice fits the decision to reuse RoseTTAFold: a structure predictor natively emits a complete structure, and asking it for "noise" would be awkward.

**Loss.** Training uses **MSE between predicted frames and the true structure, without alignment**. The paper calls this out explicitly, because the standard loss in structure prediction is FAPE (frame-aligned point error), which is invariant to the global reference frame. In a diffusion model that invariance actively hurts:

> You want the global coordinate frame to stay continuous between adjacent timesteps. If the loss lets the model place the whole molecule wherever it likes at each step, the denoising trajectory wanders over global rigid motions instead of converging along a stable path.

Put differently: **in structure prediction the symmetry is there to be exploited; in a diffusion trajectory it has to be broken** — anchored, at least, along the time axis. "The same invariance is a feature in one task and a bug in another" is a pattern worth remembering.

## 4. Self-conditioning

RFdiffusion uses self-conditioning: at step $$t$$ the network sees not only the current noised structure but also **its own $$x_0$$ prediction from the previous step**. The paper reports this notably improved performance.

The trick comes from [Chen et al.'s Analog Bits](https://arxiv.org/abs/2208.04202), and the authors note how close it is to AlphaFold2's **recycling** — in both cases the network's own intermediate output is fed back so later computation starts from a better place.

In engineering terms, self-conditioning costs an extra forward pass during training (one to produce the prediction, one to compute the loss with it) and buys coherence along the inference trajectory. The trade is usually excellent, and it barely touches the architecture.

## 5. Conditioning: protein design's "ControlNet moment"

Unconditional protein generation isn't very useful; real requests come with constraints. RFdiffusion's conditioning mechanisms map almost one-to-one onto the image world:

| RFdiffusion | Image-domain analog | How it works |
|---|---|---|
| Motif scaffolding | Inpainting | Pin a known functional fragment (coordinates + sequence) and generate the rest to hold it in place |
| Binder design + hotspots | Conditioning on a target region | Fine-tuned on complexes, with extra input marking the residues on the target to engage |
| Symmetry | Hard-constraint projection | Explicitly re-symmetrize after each denoising step, projecting back onto the symmetric subspace |
| Secondary structure / block adjacency | Layout / ControlNet | Extra topology input (which segments are helices, which contact which) to steer the fold |
| Guiding potentials | Classifier guidance | Add an external potential (attraction/repulsion, radius of gyration…) to push the trajectory at sampling time |
| Partial diffusion (`partial_T`) | SDEdit / img2img | Noise an existing structure only partway, then denoise, to diversify around a known backbone |

Two observations:

- **Symmetry is implemented by projection, not learned.** Given a point group and chain length, generate random starting frames for one subunit, replicate them $$n-1$$ times arranged by the point group, and re-symmetrize explicitly after every step. That hands the hard constraint to geometry rather than hoping the network picks it up — almost always the more reliable engineering choice when the constraint is crisp.
- **Different conditions enter through different doors**: some change the input (motif, hotspots, secondary structure), some change the sampling process (potentials, symmetrization), and some only change the initialization (partial diffusion). All three are worth considering when designing a conditional system, instead of reaching for "fine-tune another model" first.

## 6. The pipeline: let a different model grade the output

This is the most ML-flavored part of the workflow. RFdiffusion generates **backbones** only — it produces no amino acid sequence. The full pipeline has three stages:

```text
RFdiffusion             ProteinMPNN               AlphaFold2
backbone generation ->  inverse folding      ->   re-predict & compare
 (SE(3) diffusion)      (~8 sequences each)        (filter on pAE, RMSD)
```

1. **RFdiffusion** generates a 3D backbone under the given constraints.
2. **[ProteinMPNN](https://www.science.org/doi/10.1126/science.add2187)** does "inverse folding": given the backbone, design amino acid sequences that might fold into that shape — typically 8 sampled per backbone.
3. **AlphaFold2** re-predicts structures from those sequences, and the result is compared against the original design.

The paper's in-silico success criteria are three conditions at once: AF2 **pAE < 5**, overall backbone **RMSD < 2 Å**, and functional-site backbone **RMSD < 1 Å**.

This **self-consistency** metric deserves its own paragraph. The hard part of generative modeling is never generation, it's evaluation — images have FID and human eyes, proteins have neither. RFdiffusion's answer is to **let an independent model, trained on a different task, act as the judge**: if a designed backbone is genuinely realizable, then sequences designed for it should fold back to that shape under an independent structure predictor. It is essentially a **cycle-consistency / round-trip metric**.

The idea transfers, with two cautions:

- **The judge is itself a neural network, so it can be gamed.** Optimizing a differentiable (or searchable) metric drifts toward adversarial examples over time — "AF2 likes it" is not "it holds up in the real world." The paper ultimately relies on experiments: hundreds of designs were expressed and characterized, and for one binder against influenza haemagglutinin the cryo-EM structure came out nearly identical to the design model. **The lab is this pipeline's real test set.**
- **It's necessary, not sufficient.** As a **filter** — rejecting the 99% of candidates that won't work so only a few reach expensive downstream validation — it's a great deal. As the final objective function, it's dangerous.

> A question worth asking of any generative system: is there an independent model running in the opposite direction that can map my output back to its input? If so, you have a cheap automatic metric.

## 7. Inference-time knobs

Two parameters that come up constantly in practice, both with clear ML analogs:

- **Timesteps (`diffuser.T`)**: trained with 200, but inference can be much shorter — the repo defaults to **50**, and the paper notes trajectories can be compressed to ~15 steps. Same phenomenon as "train with 1000 steps, sample with 20 DDIM steps."
- **Noise scale (`noise_scale_ca` / `noise_scale_frame`)**: lower or remove the extra noise injected during reverse diffusion. The paper reports this improved success rates on 17 of 23 benchmark problems, at the cost of diversity. It's essentially the GAN truncation trick, or low-temperature sampling for LLMs, ported to diffusion — **trading diversity for sample quality**, which is a good trade whenever you only need a handful of usable outputs.

## 8. What it can do

The tasks validated in the paper, grouped by the kind of conditioning:

- **Unconditional or topology-constrained monomer design** — generate novel backbones given a length or a target fold.
- **Binder design** — given a target and the site you want to engage, design a new protein that sticks to it. This is the most widely used application today, with direct relevance to therapeutics and diagnostics.
- **Symmetric oligomers** — multi-chain assemblies following a specified point group (cyclic, dihedral, tetrahedral, …).
- **Motif scaffolding** — hold a known functional fragment (an enzyme active site, a metal-binding site, an epitope) fixed and design a new backbone that presents it stably.

Follow-up work extends the same framework, for example the 2025 [antibody design version](https://www.nature.com/articles/s41586-025-09721-5).

## Takeaways

Setting the biology aside, what RFdiffusion offers an ML practitioner:

1. **A pretrained discriminative model can serve as a generative model's denoiser.** Domain knowledge lives in the weights regardless of the objective they were trained under, and the ablation shows this beats training from scratch by a wide margin.
2. **The noise process must respect the geometry of the data.** Define the forward process on whatever manifold the data lives on — Brownian motion on $$SO(3)$$, not Gaussian noise on matrix entries.
3. **The same invariance can be a feature in one task and a bug in another.** FAPE's global invariance helps structure prediction and breaks trajectory continuity in diffusion.
4. **Give hard constraints to geometry, not to the network.** Symmetry enforced by per-step projection is far more reliable than a model you hope will learn to be symmetric.
5. **Conditioning has three entry points**: the input, the sampling process, and the initialization.
6. **With no FID available, find a reverse model and do round-trip validation.** It's an excellent filter, but don't make it the objective — the real test set lives outside your models.

## References

- Paper: [De novo design of protein structure and function with RFdiffusion](https://www.nature.com/articles/s41586-023-06415-8), *Nature* 620, 1089–1100 (2023)
- Preprint (open access): [bioRxiv 2022.12.09.519842](https://www.biorxiv.org/content/10.1101/2022.12.09.519842v2.full)
- Code: [RosettaCommons/RFdiffusion](https://github.com/RosettaCommons/RFdiffusion) (BSD license)
- [ProteinMPNN](https://www.science.org/doi/10.1126/science.add2187) / [RoseTTAFold](https://www.science.org/doi/10.1126/science.abj8754)
- Self-conditioning: [Analog Bits (Chen et al., 2022)](https://arxiv.org/abs/2208.04202)
