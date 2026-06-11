"""Nacos A2A Agent registration for the AI service."""
import logging
import socket
import json
import os
from app.a2a.agent_card import build_agent_card

logger = logging.getLogger(__name__)


class NacosA2ARegistry:
    """Register this AI service as an A2A Agent in Nacos."""

    def __init__(
        self,
        nacos_addr: str = "localhost:8848",
        service_name: str = "novel-ai-agent",
        service_port: int = 8001,
        namespace: str = "",
    ):
        self.nacos_addr = nacos_addr
        self.service_name = service_name
        self.service_port = service_port
        self.namespace = namespace
        self._client = None
        self._registered = False

    def register(self):
        """Register the A2A Agent in Nacos."""
        host = self._get_local_ip()
        agent_card = build_agent_card(host, self.service_port)

        try:
            import nacos
            self._client = nacos.NacosClient(
                server_addresses=self.nacos_addr,
                namespace=self.namespace,
            )
            self._client.add_naming_instance(
                service_name=self.service_name,
                ip=host,
                port=self.service_port,
                metadata={
                    "agent_card": json.dumps(agent_card, ensure_ascii=False),
                    "a2a_version": "1.0",
                    "protocol": "a2a",
                },
                ephemeral=True,
            )
            self._registered = True
            logger.info(
                "Registered A2A Agent [%s] at %s:%d to Nacos (%s)",
                self.service_name, host, self.service_port, self.nacos_addr,
            )
        except ImportError:
            logger.warning(
                "nacos-sdk-python not installed, A2A registration skipped"
            )
        except Exception as e:
            logger.warning("Failed to register A2A Agent to Nacos: %s", e)

    def deregister(self):
        """Deregister from Nacos on shutdown."""
        if not self._registered or not self._client:
            return
        try:
            host = self._get_local_ip()
            self._client.remove_naming_instance(
                service_name=self.service_name,
                ip=host,
                port=self.service_port,
            )
            logger.info("Deregistered A2A Agent [%s] from Nacos", self.service_name)
        except Exception as e:
            logger.warning("Failed to deregister A2A Agent: %s", e)

    @staticmethod
    def _get_local_ip() -> str:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("10.255.255.255", 1))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"


# Module-level singleton
registry = NacosA2ARegistry(
    nacos_addr=os.environ.get("NACOS_ADDR", "localhost:8848"),
    service_name="novel-ai-agent",
    service_port=int(os.environ.get("AI_SERVICE_PORT", "8001")),
)
