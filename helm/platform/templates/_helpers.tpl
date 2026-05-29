{{- define "platform.imageRegistry" -}}
{{- if .Values.global.imageRegistry -}}
{{- .Values.global.imageRegistry -}}
{{- else if and .Values.global.awsAccountId .Values.global.awsRegion -}}
{{- printf "%s.dkr.ecr.%s.amazonaws.com" (toString .Values.global.awsAccountId) .Values.global.awsRegion -}}
{{- end -}}
{{- end -}}

{{- define "platform.backendRepository" -}}
{{- printf "%s-%s" .Values.global.projectName .Values.backend.name -}}
{{- end -}}

{{- define "platform.frontendRepository" -}}
{{- printf "%s-%s" .Values.global.projectName .Values.frontend.name -}}
{{- end -}}

{{- define "platform.backendImage" -}}
{{- $registry := include "platform.imageRegistry" . -}}
{{- $repository := include "platform.backendRepository" . -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" $registry $repository .Values.backend.image.tag -}}
{{- else -}}
{{- printf "%s:%s" $repository .Values.backend.image.tag -}}
{{- end -}}
{{- end -}}

{{- define "platform.frontendImage" -}}
{{- $registry := include "platform.imageRegistry" . -}}
{{- $repository := include "platform.frontendRepository" . -}}
{{- if $registry -}}
{{- printf "%s/%s:%s" $registry $repository .Values.frontend.image.tag -}}
{{- else -}}
{{- printf "%s:%s" $repository .Values.frontend.image.tag -}}
{{- end -}}
{{- end -}}