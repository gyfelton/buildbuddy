load("@io_bazel_rules_go//go:def.bzl", "go_library")

go_library(
    name = "go_default_library",
    srcs = ["slack.go"],
    importpath = "github.com/buildbuddy-io/buildbuddy/server/backends/slack",
    visibility = ["//visibility:public"],
    deps = ["//proto:invocation_go_proto"],
)
