FROM ubuntu:16.04

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoclean && \
    apt-get clean && \
    apt-get autoremove -y

COPY ./jira /opt/atlassian/jira

EXPOSE 8080 8005

VOLUME ["/opt/atlassian/jira/", "/var/atlassian/application-data/jira"]

RUN groupadd jira && \
    useradd -g jira jira

CMD chown -R jira:jira /opt/atlassian/jira/ /var/atlassian/application-data/jira && \
    ./opt/atlassian/jira/bin/start-jira.sh -fg
