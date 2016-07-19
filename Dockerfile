FROM ubuntu:16.04
COPY ./jira /opt/atlassian/jira
EXPOSE 8080 8005
VOLUME ["/opt/atlassian/jira/", "/var/atlassian/application-data/jira"]
RUN "groupadd jira && useradd -g jira jira"
CMD ["./opt/atlassian/jira/bin/start-jira.sh", "-fg"]
