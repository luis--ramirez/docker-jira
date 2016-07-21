FROM debian:8.5

COPY ./jira /opt/atlassian/jira

EXPOSE 8080 8005

RUN mkdir -p /var/atlassian/application-data/jira && \
    groupadd jira && \
    useradd -g jira jira && \
    chown -R jira:jira /opt/atlassian/jira/ /var/atlassian/application-data/jira

VOLUME ["/opt/atlassian/jira/", "/var/atlassian/application-data/jira"]

USER jira

CMD ./opt/atlassian/jira/bin/start-jira.sh -fg
