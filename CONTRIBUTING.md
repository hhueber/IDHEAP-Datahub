# Contributing

First of all, thank you for taking the time to help this project, it means a lot.

To sum-up:
* Do you know Python? You can help the project by [reviewing code](https://github.com/hhueber/IDHEAP-Datahub/pulls), [fixing bugs](https://github.com/hhueber/IDHEAP-Datahub/issues?q=is%3Aissue+is%3Aopen+label%3Abug), and [adding features](https://github.com/hhueber/IDHEAP-Datahub/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)!
* Every little step helps! Feel free to scroll through the [good first issues](https://github.com/hhueber/IDHEAP-Datahub/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) for quick tasks.
* No matter what you know, you can always [report a bug or ask for a feature](https://github.com/hhueber/IDHEAP-Datahub/issues/new/choose), [enhance the documentaation](https://github.com/hhueber/IDHEAP-Datahub/wiki), or [get in touch](mailto:helpdesk@unil.ch?cc=hugo.hueber@unil.ch&subject=%5BDCSR%2C%20IDHEAP%20Datahub%5D%20From%20GitHub)!

## Documentation

Documentation is particularly important for us, and for this project in particular. Thus, any help is welcome, let alone fixing typos. Feel free to enhance it in the [Wiki](https://github.com/hhueber/IDHEAP-Datahub/wiki).

- In general, you should not hesitate to be clear about "how does it works"!
- This means documenting when you add something, documenting when you change something, documenting when you test something, ...
- In short, documenting so that the next person has to look for information as little as possible!

## Development

Before anything, make sure you followed the [Setup page](https://github.com/hhueber/IDHEAP-Datahub/).

### Workflow

We follow the [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow): all code contributions are submitted via a pull request towards the main branch.

The convention for adding code to the Corv code base is as follows:
- First, the developer makes a separate branch from the `main` branch (e.g., `feature-branch`) to implement their changes.
- Next, a pull request is opened, which must be reviewed by another person.
  - Don't forget to merge `main` and fix conflicts before submitting your branch for review.
- Once the review is complete, the developer can merge their branch into `main`.
  - The merge should be a ‘squash and merge’: the title of the commit must contain general information about the pull request, and the body of the commit must contain the list of commits used during development, and more details if needed.
  - One exception can be for a major feature, containing multiple smaller features.
- When the `main` branch is considered stable, the product owner merges the `main` branch into the `prod` branch.

An example of a "squash and merge" commit :

```
Buttons in /monitoring (#280)

* Working prototype
* Add notify
* Small fixes and typo
* Error handling
* Better error messages
* Add force check state
* Rollback success to res
* Reverts and typo
* Slightly clearer formatting for javascript
* Default sort Job on state_datetime
* Glen's suggestions
* Remove unused, add ended state check
* Fix merge mistake
```

Moreover:
- When creating a new branch to fix an issue, please refer to the issue in the branch name, starting by its number (e.g., `42-loader-does-not-load`).
- The title of your PR must be explicit.
- When fixing an issue, please explicit it using the "Fix" keyword, and the exact title of the issue. (e.g., "`Fix #42: Loader does not load`").
  - If fixing multiple issues in one branch (please avoid if possible), add multiple "Fix" (e.g., `Fix #874, Fix #785: Refactor of email handling`).
- The PR description may contain any additional information (the more the merrier!), but do not forget to mirror it in the documentation when needed.
- Please add a screenshot when the PR has an impact on UI/UX.
- Please take into account that your PR will result in one commit; you may want to squash/rebase yourself beforehand.
- Please link the issues and the PR when needed.

### Commits

We use `pre-commit`s so that the code is pretty and quite standard. You can find what is happening in the [.pre-commit-config.yaml](./.pre-commit-config.yaml) and [pyproject.toml](./pyproject.toml) files, but basically, for each commit:

- [`black`](https://github.com/psf/black) formats the code correctly.
- [`isort`](https://pycqa.github.io/isort/) sorts the imports.

Regarding commit messages:
- [Don't do that](https://xkcd.com/1296/), and we're cool.
- When fixing an issue, please explicit it using the "Fix" keyword, and the exact title of the issue. (e.g., "Fix #42: Loader does not load").

Notes:

- You can run pre-commit independently using `pre-commit run --all-files`
- If, for some reason, you need to commit without a check, use `git commit --no-verify [...]`

### Code convention

In general, try to follow [PEP 8](https://peps.python.org/pep-0008/). In general:
- Use `black` and `isort` as well as your IDE linter!
- Use double quotes instead of single quotes.
- Comment when necessary. If the code is self-explaining, don't bother.

### Versioning

We follow [Semantic versioning](https://en.wikipedia.org/wiki/Software_versioning#Semantic_versioning) with the following added twist:
- Each commit is (in theory) increasing the patch number.
- Whenever main is merged into prod, we increase the minor number.
- If a change is breaking, we increase the major number.

### Testing

Please, test your changes locally before opening a PR.

## Thank you in advance!
