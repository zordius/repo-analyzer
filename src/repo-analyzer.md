Look into all this project, try to extract the practices and domain knowledges from this project.

* When we say: 'look into all this project', it includes:
  * all directories and all files in this project (defined as level 1 analyze)
    * follow the .gitignore file if the project is in a git respository
  * all commits in the git repository (defined as level 2 analyze)
    * if the project is under the git mono repository, considering only files under this project
  * all files under the .github directory of git repository (defined as level 3 analyze)
    * look into github flows and actions to extract practices related with the project
* When we say 'extract practices':
  * we like to mark practices with proper labels.
    * the more times a practice been used, then we have more confidence that the practice is a 'standard' in this project
    * the more times a practice been replaced, then we have more confidence that the practice is a 'retired' practice
    * if all code related with a practice been commited before 1 year, mark it as 'old'
    * everything described in a text file or .md file should be labeled with 'document'
    * if the practice are well known in the world, it can be labeled with 'common' practice
    * when a practice fit into these, it can be labeled as 'rule':
      * there is no exception for a practice in this project
        * 'no exception' means there is no other way to do onething compare to the practice
      * the practice been used more then 90% in this project
        * 'more then 90%' also means 'less then 10%' exception practice
      * when exception practice happened, there are some reason can explain the exception
      * we can see git commits try to adopt the practice, and the commit message may related with
        * align practice
        * fix for rule
    * when the practice related with testing, label it with 'testing'
  * we also look into different setting files:
    * when look into lint setting files:
      * mark extracted practices as 'lint'
      * if it forced, also mark as 'rule'
  * all practices will be write into a file `ai4ci-practices.md`
    * the file will be in markdown format
    * one practice will be a bullet list item as a simple description for the practice
      * all files related with the practice will be bullet list items as next level of the practice, the bullet list item will contain the relative path and name, for example: `* file: relative/path/filename`
      * all labels related with a practice will be a bullet list items as next level of the practice, the bullet list item will contain the label name, for example: `* label: lint`
* When we say 'extract domain knowledges':
  * try to figure out the context of codes by vairable names
  * try to receive requirements, focus on:
    * things related with business
