FROM --platform=linux/amd64 registry.fedoraproject.org/fedora-minimal:42-x86_64

LABEL org.opencontainers.image.source https://github.com/OliveTin/OliveTin-config-helper
LABEL org.opencontainers.image.title OliveTin-config-helper

RUN mkdir -p /var/www/olivetin-config-helper \
    && \
	microdnf install -y --nodocs --noplugins --setopt=keepcache=0 --setopt=install_weak_deps=0 \
		shadow-utils \
	&& microdnf clean all

RUN useradd --system --create-home olivetin-config-helper -u 1000

EXPOSE 9485/tcp

COPY OliveTin-config-helper /usr/bin/OliveTin-config-helper
COPY frontend/dist /var/www/olivetin-config-helper/

USER olivetin-config-helper

ENTRYPOINT [ "/usr/bin/OliveTin-config-helper" ]
